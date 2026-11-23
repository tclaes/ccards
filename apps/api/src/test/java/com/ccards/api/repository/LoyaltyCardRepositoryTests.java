package com.ccards.api.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import jakarta.persistence.EntityManager;

/**
 * Runs against the real migrations on a throwaway PostgreSQL. Skipped (not failed)
 * when Docker is unavailable, so {@code nx test api} stays Docker-optional.
 */
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("local") // the default profile has no datasource; @ServiceConnection swaps in the container URL
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(AuditingConfig.class)
class LoyaltyCardRepositoryTests {

	@Container
	@ServiceConnection
	static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17");

	private static final UUID OWNER = UUID.randomUUID();

	@Autowired
	private LoyaltyCardRepository repository;

	@Autowired
	private EntityManager entityManager;

	@Autowired
	private JdbcTemplate jdbc;

	private LoyaltyCard newCard(BarcodeType type, UUID owner) {
		return new LoyaltyCard("Groceries", "Delhaize", "1234567890", type, owner);
	}

	/** Writes to the database and drops cached entities, so the next load reads real rows. */
	private void flushAndClear() {
		entityManager.flush();
		entityManager.clear();
	}

	@Test
	void savedCardLoadsBackWithAllFields() {
		LoyaltyCard card = newCard(BarcodeType.EAN_13, OWNER);
		card.setColor("#ff0000");
		card.setNote("Ask for the blue bag");
		UUID id = repository.save(card).getId();
		flushAndClear();

		LoyaltyCard loaded = repository.findById(id).orElseThrow();

		assertThat(loaded.getId()).isNotNull();
		assertThat(loaded.getName()).isEqualTo("Groceries");
		assertThat(loaded.getStore()).isEqualTo("Delhaize");
		assertThat(loaded.getCardNumber()).isEqualTo("1234567890");
		assertThat(loaded.getBarcodeType()).isEqualTo(BarcodeType.EAN_13);
		assertThat(loaded.getColor()).isEqualTo("#ff0000");
		assertThat(loaded.getNote()).isEqualTo("Ask for the blue bag");
		assertThat(loaded.getOwnerId()).isEqualTo(OWNER);
	}

	@Test
	void colorAndNoteAreOptional() {
		UUID id = repository.save(newCard(BarcodeType.CODE_128, OWNER)).getId();
		flushAndClear();

		LoyaltyCard loaded = repository.findById(id).orElseThrow();

		assertThat(loaded.getColor()).isNull();
		assertThat(loaded.getNote()).isNull();
	}

	@Test
	void everyBarcodeTypeRoundTrips() {
		for (BarcodeType type : BarcodeType.values()) {
			UUID id = repository.save(newCard(type, OWNER)).getId();
			flushAndClear();

			assertThat(repository.findById(id).orElseThrow().getBarcodeType()).isEqualTo(type);
		}
	}

	@Test
	void cardWithoutCardNumberIsRejected() {
		LoyaltyCard card = new LoyaltyCard("Groceries", "Delhaize", null, BarcodeType.EAN_13, OWNER);

		assertThatThrownBy(() -> repository.saveAndFlush(card))
			.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void unknownBarcodeTypeIsRejectedByTheDatabase() {
		assertThatThrownBy(() -> jdbc.update(
			"""
			insert into loyalty_card (id, name, store, card_number, barcode_type, owner_id, created_at, updated_at)
			values (?, 'n', 's', '1', 'MORSE', ?, now(), now())
			""",
			UUID.randomUUID(), OWNER))
			.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void timestampsAreSetOnCreate() {
		LoyaltyCard saved = repository.saveAndFlush(newCard(BarcodeType.EAN_13, OWNER));

		assertThat(saved.getCreatedAt()).isNotNull();
		assertThat(saved.getUpdatedAt()).isEqualTo(saved.getCreatedAt());
	}

	@Test
	void updateMovesUpdatedAtAndKeepsCreatedAt() {
		UUID id = repository.saveAndFlush(newCard(BarcodeType.EAN_13, OWNER)).getId();
		flushAndClear();

		// Read from the database first: PostgreSQL stores microseconds, the JVM clock has nanoseconds.
		LoyaltyCard loaded = repository.findById(id).orElseThrow();
		Instant createdAt = loaded.getCreatedAt();
		loaded.setName("Renamed");
		repository.saveAndFlush(loaded);
		flushAndClear();

		LoyaltyCard reloaded = repository.findById(id).orElseThrow();
		assertThat(reloaded.getCreatedAt()).isEqualTo(createdAt);
		assertThat(reloaded.getUpdatedAt()).isAfter(createdAt);
	}

	@Test
	void findsOnlyTheCardsOfTheOwner() {
		UUID otherOwner = UUID.randomUUID();
		repository.save(newCard(BarcodeType.EAN_13, OWNER));
		repository.save(newCard(BarcodeType.QR_CODE, otherOwner));
		flushAndClear();

		assertThat(repository.findAllByOwnerId(OWNER))
			.hasSize(1)
			.allMatch(card -> card.getOwnerId().equals(OWNER));
	}

	@Test
	void ownerWithoutCardsGetsAnEmptyList() {
		assertThat(repository.findAllByOwnerId(UUID.randomUUID())).isEmpty();
	}

	@Test
	void versionStartsAtZeroAndGrowsWithEveryUpdate() {
		LoyaltyCard card = repository.saveAndFlush(newCard(BarcodeType.EAN_13, OWNER));
		assertThat(card.getVersion()).isZero();

		card.setName("Renamed");
		repository.saveAndFlush(card);

		assertThat(card.getVersion()).isEqualTo(1);
	}

	@Test
	void staleUpdateIsRejected() {
		UUID id = repository.saveAndFlush(newCard(BarcodeType.EAN_13, OWNER)).getId();
		flushAndClear();
		LoyaltyCard first = repository.findById(id).orElseThrow();
		entityManager.detach(first);
		LoyaltyCard second = repository.findById(id).orElseThrow();
		second.setName("Second wins");
		repository.saveAndFlush(second);

		first.setName("First is too late");

		assertThatThrownBy(() -> repository.saveAndFlush(first))
			.isInstanceOf(ObjectOptimisticLockingFailureException.class);
	}

}
