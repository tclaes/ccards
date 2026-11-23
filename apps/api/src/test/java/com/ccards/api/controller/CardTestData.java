package com.ccards.api.controller;

import java.time.Instant;
import java.util.UUID;

import org.springframework.test.util.ReflectionTestUtils;

import com.ccards.api.repository.BarcodeType;
import com.ccards.api.repository.LoyaltyCard;

/** Builds stored-looking cards: id and audit timestamps are normally set by JPA. */
final class CardTestData {

	static final UUID OWNER = UUID.randomUUID();

	private CardTestData() {
	}

	static LoyaltyCard card(UUID id, String name) {
		LoyaltyCard card = new LoyaltyCard(name, "Store of " + name, "1234567890", BarcodeType.EAN_13, OWNER);
		ReflectionTestUtils.setField(card, "id", id);
		ReflectionTestUtils.setField(card, "createdAt", Instant.parse("2026-01-02T03:04:05Z"));
		ReflectionTestUtils.setField(card, "updatedAt", Instant.parse("2026-02-03T04:05:06Z"));
		return card;
	}

}
