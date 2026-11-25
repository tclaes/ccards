package com.ccards.api.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.test.util.ReflectionTestUtils;

import com.ccards.api.generated.model.BarcodeType;
import com.ccards.api.generated.model.Card;
import com.ccards.api.repository.LoyaltyCard;

class CardMapperTests {

	private final CardMapper mapper = Mappers.getMapper(CardMapper.class);

	@Test
	void mapsEveryFieldAndConvertsTimestampsToUtc() {
		UUID id = UUID.randomUUID();
		LoyaltyCard entity = CardTestData.card(id, "Albert Heijn");
		entity.setColor("#00a0e2");
		entity.setNote("Bonus card");
		ReflectionTestUtils.setField(entity, "favorite", true);

		Card card = mapper.toCard(entity);

		assertThat(card.getId()).isEqualTo(id);
		assertThat(card.getName()).isEqualTo("Albert Heijn");
		assertThat(card.getStore()).isEqualTo("Store of Albert Heijn");
		assertThat(card.getCardNumber()).isEqualTo("1234567890");
		assertThat(card.getBarcodeType()).isEqualTo(BarcodeType.EAN_13);
		assertThat(card.getColor()).isEqualTo("#00a0e2");
		assertThat(card.getNote()).isEqualTo("Bonus card");
		assertThat(card.getFavorite()).isTrue();
		assertThat(card.getCreatedAt()).isEqualTo(OffsetDateTime.parse("2026-01-02T03:04:05Z"));
		assertThat(card.getUpdatedAt()).isEqualTo(OffsetDateTime.parse("2026-02-03T04:05:06Z"));
	}

	@Test
	void leavesOptionalFieldsEmpty() {
		Card card = mapper.toCard(CardTestData.card(UUID.randomUUID(), "Colruyt"));

		assertThat(card.getColor()).isNull();
		assertThat(card.getNote()).isNull();
	}

}
