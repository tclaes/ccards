package com.ccards.api.controller;

import java.net.URI;
import java.util.UUID;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.ccards.api.generated.api.CardsApi;
import com.ccards.api.generated.model.Card;
import com.ccards.api.generated.model.CardInput;
import com.ccards.api.generated.model.CardPage;
import com.ccards.api.repository.BarcodeType;
import com.ccards.api.repository.LoyaltyCard;
import com.ccards.api.service.CardData;
import com.ccards.api.service.CardService;

import tools.jackson.databind.JsonNode;

@ConditionalOnProperty("spring.datasource.url") // no database in the default profile, so no cards
@RestController
public class CardController implements CardsApi {

	/** Name first; id breaks ties so pages never overlap or skip cards. */
	private static final Sort ORDER = Sort.by("name", "id");

	private final CardService service;

	private final CardMapper mapper;

	public CardController(CardService service, CardMapper mapper) {
		this.service = service;
		this.mapper = mapper;
	}

	@Override
	public ResponseEntity<CardPage> listCards(Integer page, Integer size) {
		Page<LoyaltyCard> cards = service.list(PageRequest.of(page, size, ORDER));
		CardPage body = new CardPage(cards.map(mapper::toCard).getContent(), cards.getNumber(), cards.getSize(),
				cards.getTotalElements(), cards.getTotalPages());
		return ResponseEntity.ok(body);
	}

	@Override
	public ResponseEntity<Card> getCard(UUID id) {
		return ResponseEntity.ok(mapper.toCard(service.get(id)));
	}

	@Override
	public ResponseEntity<Card> createCard(CardInput input) {
		LoyaltyCard card = service.create(new CardData(input.getName(), input.getStore(), input.getCardNumber(),
				BarcodeType.valueOf(input.getBarcodeType().name()), input.getColor(), input.getNote()));
		URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").build(card.getId());
		return ResponseEntity.created(location).body(mapper.toCard(card));
	}

	@Override
	public ResponseEntity<Card> patchCard(UUID id, JsonNode cardPatch) {
		return ResponseEntity.ok(mapper.toCard(service.patch(id, cardPatch)));
	}

	@Override
	public ResponseEntity<Void> deleteCard(UUID id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}

}
