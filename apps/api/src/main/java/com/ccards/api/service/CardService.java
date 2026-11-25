package com.ccards.api.service;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ccards.api.repository.LoyaltyCard;
import com.ccards.api.repository.LoyaltyCardRepository;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;
import tools.jackson.databind.JsonNode;

/** Card reads and writes. Each write is one transaction: it all happens, or nothing does. */
@ConditionalOnProperty("spring.datasource.url") // no database in the default profile, so no cards
@Service
@Transactional(readOnly = true)
public class CardService {

	private final LoyaltyCardRepository repository;

	private final Validator validator;

	private final CardPatchReader patchReader;

	private final UUID defaultOwnerId;

	CardService(LoyaltyCardRepository repository, Validator validator, CardPatchReader patchReader,
			@Value("${ccards.default-owner-id}") UUID defaultOwnerId) {
		this.repository = repository;
		this.validator = validator;
		this.patchReader = patchReader;
		this.defaultOwnerId = defaultOwnerId;
	}

	public Page<LoyaltyCard> list(Pageable pageable) {
		return repository.findAll(pageable);
	}

	public LoyaltyCard get(UUID id) {
		return find(id);
	}

	@Transactional
	public LoyaltyCard create(CardData data) {
		validate(data);
		LoyaltyCard card = new LoyaltyCard(data.name(), data.store(), data.cardNumber(), data.barcodeType(),
				defaultOwnerId);
		card.setColor(data.color());
		card.setNote(data.note());
		return repository.saveAndFlush(card);
	}

	@Transactional
	public LoyaltyCard patch(UUID id, JsonNode body) {
		LoyaltyCard card = find(id);
		CardPatchReader.Patch patch = patchReader.read(body, toData(card));
		if (patch.version() != card.getVersion()) {
			throw new ObjectOptimisticLockingFailureException(LoyaltyCard.class, id);
		}
		validate(patch.merged());
		apply(card, patch.merged());
		// Flush so the response carries the new version and a stale concurrent write fails here.
		return repository.saveAndFlush(card);
	}

	/** Counts one use of the card. Not an edit: the card's version and updatedAt stay as they are. */
	@Transactional
	public void recordUse(UUID id) {
		if (repository.recordUse(id, Instant.now()) == 0) {
			throw new CardNotFoundException(id);
		}
	}

	/** Marks or unmarks a favorite. Not an edit: the card's version and updatedAt stay as they are. */
	@Transactional
	public void setFavorite(UUID id, boolean favorite) {
		if (repository.setFavorite(id, favorite) == 0) {
			throw new CardNotFoundException(id);
		}
	}

	@Transactional
	public void delete(UUID id) {
		repository.delete(find(id));
	}

	private LoyaltyCard find(UUID id) {
		return repository.findById(id).orElseThrow(() -> new CardNotFoundException(id));
	}

	private void validate(CardData data) {
		Set<ConstraintViolation<CardData>> violations = validator.validate(data);
		if (!violations.isEmpty()) {
			throw new ConstraintViolationException(violations);
		}
	}

	private static CardData toData(LoyaltyCard card) {
		return new CardData(card.getName(), card.getStore(), card.getCardNumber(), card.getBarcodeType(),
				card.getColor(), card.getNote());
	}

	private static void apply(LoyaltyCard card, CardData data) {
		card.setName(data.name());
		card.setStore(data.store());
		card.setCardNumber(data.cardNumber());
		card.setBarcodeType(data.barcodeType());
		card.setColor(data.color());
		card.setNote(data.note());
	}

}
