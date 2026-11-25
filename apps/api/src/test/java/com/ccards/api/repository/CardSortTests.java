package com.ccards.api.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import com.ccards.api.service.CardSort;

/**
 * The {@link CardSort} orders as PostgreSQL applies them. Lives next to the repository for its auditing setup.
 * Skipped (not failed) when Docker is unavailable.
 */
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("local") // the default profile has no datasource; @ServiceConnection swaps in the container URL
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(AuditingConfig.class)
class CardSortTests {

	@Container
	@ServiceConnection
	static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17");

	private static final Instant MONDAY = Instant.parse("2026-11-02T10:00:00Z");

	private static final Instant TUESDAY = Instant.parse("2026-11-03T10:00:00Z");

	@Autowired
	private LoyaltyCardRepository repository;

	private UUID delhaize;

	private UUID colruyt;

	@BeforeEach
	void storeCards() {
		delhaize = store("Delhaize");
		store("Albert Heijn");
		colruyt = store("Colruyt");
		store("Aldi");
		// Delhaize three times on Monday, Colruyt once on Tuesday, the others never.
		repository.recordUse(delhaize, MONDAY);
		repository.recordUse(delhaize, MONDAY);
		repository.recordUse(delhaize, MONDAY);
		repository.recordUse(colruyt, TUESDAY);
	}

	private UUID store(String name) {
		return repository
			.saveAndFlush(new LoyaltyCard(name, "Store", "1", BarcodeType.CODE_128, UUID.randomUUID()))
			.getId();
	}

	private List<String> names(CardSort order) {
		return names(order, 0, 20);
	}

	private List<String> names(CardSort order, int page, int size) {
		return repository.findAll(PageRequest.of(page, size, order.sort())).map(LoyaltyCard::getName).getContent();
	}

	@Test
	void byName() {
		assertThat(names(CardSort.NAME)).containsExactly("Albert Heijn", "Aldi", "Colruyt", "Delhaize");
	}

	@Test
	void lastUsedPutsNeverUsedCardsLastOrderedByName() {
		assertThat(names(CardSort.LAST_USED)).containsExactly("Colruyt", "Delhaize", "Albert Heijn", "Aldi");
	}

	@Test
	void mostUsedBreaksTiesByName() {
		assertThat(names(CardSort.MOST_USED)).containsExactly("Delhaize", "Colruyt", "Albert Heijn", "Aldi");
	}

	@Test
	void aFavoriteComesFirstInEveryOrder() {
		UUID zeeman = store("Zeeman"); // never used and last by name
		repository.setFavorite(zeeman, true);

		for (CardSort order : CardSort.values()) {
			assertThat(names(order)).as(order.name()).startsWith("Zeeman");
		}
	}

	@Test
	void theChosenOrderAppliesWithinTheFavorites() {
		repository.setFavorite(delhaize, true);
		repository.setFavorite(colruyt, true);

		assertThat(names(CardSort.NAME)).containsExactly("Colruyt", "Delhaize", "Albert Heijn", "Aldi");
		assertThat(names(CardSort.LAST_USED)).containsExactly("Colruyt", "Delhaize", "Albert Heijn", "Aldi");
		assertThat(names(CardSort.MOST_USED)).containsExactly("Delhaize", "Colruyt", "Albert Heijn", "Aldi");
	}

	@Test
	void theOrderAppliesBeforeSplittingIntoPages() {
		assertThat(names(CardSort.MOST_USED, 0, 3)).containsExactly("Delhaize", "Colruyt", "Albert Heijn");
		assertThat(names(CardSort.MOST_USED, 1, 3)).containsExactly("Aldi");
	}

}
