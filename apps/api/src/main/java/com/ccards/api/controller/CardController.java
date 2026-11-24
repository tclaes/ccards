package com.ccards.api.controller;

import java.net.URI;
import java.util.UUID;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.ccards.api.generated.api.CardsApi;
import com.ccards.api.generated.model.Card;
import com.ccards.api.generated.model.CardInput;
import com.ccards.api.generated.model.CardPage;
import com.ccards.api.repository.BarcodeType;
import com.ccards.api.repository.LoyaltyCard;
import com.ccards.api.service.BarcodeService;
import com.ccards.api.service.CardData;
import com.ccards.api.service.CardService;
import com.ccards.api.service.ImageFormat;

import tools.jackson.databind.JsonNode;

@ConditionalOnProperty("spring.datasource.url") // no database in the default profile, so no cards
@RestController
public class CardController implements CardsApi {

	/** Name first; id breaks ties so pages never overlap or skip cards. */
	private static final Sort ORDER = Sort.by("name", "id");

	private static final MediaType IMAGE_SVG = MediaType.valueOf("image/svg+xml");

	/** Clients may keep the image but must revalidate it, so an edited card never shows a stale barcode. */
	private static final CacheControl BARCODE_CACHE = CacheControl.noCache().cachePrivate();

	private final CardService service;

	private final BarcodeService barcodes;

	private final CardMapper mapper;

	public CardController(CardService service, BarcodeService barcodes, CardMapper mapper) {
		this.service = service;
		this.barcodes = barcodes;
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
	public ResponseEntity<Resource> getCardBarcode(UUID id, String format, String ifNoneMatch) {
		ImageFormat imageFormat = ImageFormat.fromParameter(format);
		LoyaltyCard card = service.get(id);
		// Any change to the image goes through an update, which raises the version.
		String etag = "\"" + card.getVersion() + "-" + imageFormat.parameterValue() + "\"";
		if (matches(ifNoneMatch, etag)) {
			return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(etag).cacheControl(BARCODE_CACHE).build();
		}
		byte[] image = barcodes.render(card, imageFormat);
		return ResponseEntity.ok()
			.contentType(imageFormat == ImageFormat.PNG ? MediaType.IMAGE_PNG : IMAGE_SVG)
			.eTag(etag)
			.cacheControl(BARCODE_CACHE)
			.body(new ByteArrayResource(image));
	}

	/** {@code If-None-Match} may hold several tags, weak tags or {@code *}. */
	private static boolean matches(String ifNoneMatch, String etag) {
		if (ifNoneMatch == null) {
			return false;
		}
		HttpHeaders headers = new HttpHeaders();
		headers.set(HttpHeaders.IF_NONE_MATCH, ifNoneMatch);
		return headers.getIfNoneMatch()
			.stream()
			.anyMatch(tag -> tag.equals("*") || tag.replaceFirst("^W/", "").equals(etag));
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
	public ResponseEntity<Void> registerCardUsage(UUID id) {
		service.recordUse(id);
		return ResponseEntity.noContent().build();
	}

	@Override
	public ResponseEntity<Void> deleteCard(UUID id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}

}
