package com.ccards.api.controller;

import java.net.URI;
import java.time.ZoneOffset;
import java.util.UUID;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.ccards.api.generated.api.CardsApi;
import com.ccards.api.generated.model.Card;
import com.ccards.api.generated.model.CardInput;
import com.ccards.api.repository.BarcodeType;
import com.ccards.api.repository.LoyaltyCard;
import com.ccards.api.service.CardData;
import com.ccards.api.service.CardService;

import tools.jackson.databind.JsonNode;

/** Needs {@link CardService}, so it exists only where a datasource is configured. */
@RestController
@ConditionalOnProperty("spring.datasource.url")
public class CardController implements CardsApi {

	private final CardService service;

	public CardController(CardService service) {
		this.service = service;
	}

	@Override
	public ResponseEntity<Card> createCard(CardInput input) {
		LoyaltyCard card = service.create(new CardData(input.getName(), input.getStore(), input.getCardNumber(),
				BarcodeType.valueOf(input.getBarcodeType().name()), input.getColor(), input.getNote()));
		URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").build(card.getId());
		return ResponseEntity.created(location).body(toResponse(card));
	}

	@Override
	public ResponseEntity<Card> patchCard(UUID id, JsonNode cardPatch) {
		return ResponseEntity.ok(toResponse(service.patch(id, cardPatch)));
	}

	@Override
	public ResponseEntity<Void> deleteCard(UUID id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}

	private static Card toResponse(LoyaltyCard card) {
		Card response = new Card();
		response.setId(card.getId());
		response.setVersion(card.getVersion());
		response.setName(card.getName());
		response.setStore(card.getStore());
		response.setCardNumber(card.getCardNumber());
		response.setBarcodeType(com.ccards.api.generated.model.BarcodeType.valueOf(card.getBarcodeType().name()));
		response.setColor(card.getColor());
		response.setNote(card.getNote());
		response.setCreatedAt(card.getCreatedAt().atOffset(ZoneOffset.UTC));
		response.setUpdatedAt(card.getUpdatedAt().atOffset(ZoneOffset.UTC));
		return response;
	}

}
