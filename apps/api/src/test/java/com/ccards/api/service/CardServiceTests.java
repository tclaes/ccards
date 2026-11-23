package com.ccards.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import com.ccards.api.repository.BarcodeType;
import com.ccards.api.repository.LoyaltyCard;
import com.ccards.api.repository.LoyaltyCardRepository;

import jakarta.validation.Validation;

class CardServiceTests {

	private final LoyaltyCardRepository repository = mock(LoyaltyCardRepository.class);

	private final CardService service = new CardService(repository, Validation.buildDefaultValidatorFactory().getValidator(),
			new CardPatchReader(), UUID.randomUUID());

	private static LoyaltyCard card(UUID id) {
		LoyaltyCard card = new LoyaltyCard("Name", "Store", "123", BarcodeType.QR_CODE, UUID.randomUUID());
		ReflectionTestUtils.setField(card, "id", id);
		return card;
	}

	@Test
	void getReturnsTheStoredCard() {
		UUID id = UUID.randomUUID();
		LoyaltyCard card = card(id);
		when(repository.findById(id)).thenReturn(Optional.of(card));

		assertThat(service.get(id)).isSameAs(card);
	}

	@Test
	void getThrowsForUnknownId() {
		UUID id = UUID.randomUUID();
		when(repository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service.get(id)).isInstanceOf(CardNotFoundException.class);
	}

	@Test
	void listPassesThePageRequestToTheRepository() {
		Pageable pageable = PageRequest.of(1, 5);
		PageImpl<LoyaltyCard> page = new PageImpl<>(List.of(card(UUID.randomUUID())), pageable, 6);
		when(repository.findAll(pageable)).thenReturn(page);

		assertThat(service.list(pageable)).isSameAs(page);
	}

}
