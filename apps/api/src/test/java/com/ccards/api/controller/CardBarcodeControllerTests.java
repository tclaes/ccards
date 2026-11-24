package com.ccards.api.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import com.ccards.api.error.GlobalExceptionHandler;
import com.ccards.api.repository.LoyaltyCard;
import com.ccards.api.service.BarcodeNotRenderableException;
import com.ccards.api.service.BarcodeService;
import com.ccards.api.service.CardNotFoundException;
import com.ccards.api.service.CardService;
import com.ccards.api.service.ImageFormat;

/** Web layer only: card lookup and rendering are mocked. */
@WebMvcTest(controllers = CardController.class, properties = "spring.datasource.url=jdbc:unused")
@Import({ GlobalExceptionHandler.class, CardMapperImpl.class })
class CardBarcodeControllerTests {

	private static final MediaType SVG = MediaType.valueOf("image/svg+xml");

	private static final byte[] IMAGE = { 1, 2, 3 };

	private final UUID id = UUID.randomUUID();

	@Autowired
	private MockMvc mvc;

	@MockitoBean
	private CardService service;

	@MockitoBean
	private BarcodeService barcodes;

	@Test
	void returnsAPngByDefaultWithCacheHeaders() throws Exception {
		LoyaltyCard card = cardWithVersion(3);
		when(service.get(id)).thenReturn(card);
		when(barcodes.render(card, ImageFormat.PNG)).thenReturn(IMAGE);

		mvc.perform(get("/api/cards/{id}/barcode", id))
			.andExpect(status().isOk())
			.andExpect(content().contentType(MediaType.IMAGE_PNG))
			.andExpect(content().bytes(IMAGE))
			.andExpect(header().string(HttpHeaders.ETAG, "\"3-png\""))
			.andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-cache, private"));
	}

	@Test
	void returnsAnSvgWhenAsked() throws Exception {
		LoyaltyCard card = cardWithVersion(3);
		when(service.get(id)).thenReturn(card);
		when(barcodes.render(card, ImageFormat.SVG)).thenReturn(IMAGE);

		mvc.perform(get("/api/cards/{id}/barcode", id).param("format", "svg"))
			.andExpect(status().isOk())
			.andExpect(content().contentType(SVG))
			.andExpect(header().string(HttpHeaders.ETAG, "\"3-svg\""));
	}

	@Test
	void answers304WithoutRenderingWhenTheEtagMatches() throws Exception {
		when(service.get(id)).thenReturn(cardWithVersion(3));

		mvc.perform(get("/api/cards/{id}/barcode", id).header(HttpHeaders.IF_NONE_MATCH, "\"3-png\""))
			.andExpect(status().isNotModified())
			.andExpect(header().string(HttpHeaders.ETAG, "\"3-png\""))
			.andExpect(content().bytes(new byte[0]));

		verify(barcodes, never()).render(any(), any());
	}

	@Test
	void answers304ForWeakTagsAndTagListsToo() throws Exception {
		when(service.get(id)).thenReturn(cardWithVersion(3));

		mvc.perform(get("/api/cards/{id}/barcode", id).header(HttpHeaders.IF_NONE_MATCH, "\"1-png\", W/\"3-png\""))
			.andExpect(status().isNotModified());
		mvc.perform(get("/api/cards/{id}/barcode", id).header(HttpHeaders.IF_NONE_MATCH, "*"))
			.andExpect(status().isNotModified());

		verify(barcodes, never()).render(any(), any());
	}

	@Test
	void anOldEtagGetsTheNewImageAndANewEtag() throws Exception {
		LoyaltyCard card = cardWithVersion(4);
		when(service.get(id)).thenReturn(card);
		when(barcodes.render(card, ImageFormat.PNG)).thenReturn(IMAGE);

		mvc.perform(get("/api/cards/{id}/barcode", id).header(HttpHeaders.IF_NONE_MATCH, "\"3-png\""))
			.andExpect(status().isOk())
			.andExpect(header().string(HttpHeaders.ETAG, "\"4-png\""));
	}

	@Test
	void anEtagFromAnotherFormatDoesNotMatch() throws Exception {
		LoyaltyCard card = cardWithVersion(3);
		when(service.get(id)).thenReturn(card);
		when(barcodes.render(card, ImageFormat.SVG)).thenReturn(IMAGE);

		mvc.perform(get("/api/cards/{id}/barcode", id).param("format", "svg")
			.header(HttpHeaders.IF_NONE_MATCH, "\"3-png\""))
			.andExpect(status().isOk());
	}

	@Test
	void unknownCardIs404() throws Exception {
		when(service.get(id)).thenThrow(new CardNotFoundException(id));

		mvc.perform(get("/api/cards/{id}/barcode", id))
			.andExpect(status().isNotFound())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.detail").value("Card not found."));
	}

	@Test
	void errorsStayProblemJsonWhenTheClientOnlyAcceptsImages() throws Exception {
		when(service.get(id)).thenThrow(new CardNotFoundException(id));

		mvc.perform(get("/api/cards/{id}/barcode", id).accept(MediaType.IMAGE_PNG))
			.andExpect(status().isNotFound())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
	}

	@Test
	void unknownFormatIs400() throws Exception {
		mvc.perform(get("/api/cards/{id}/barcode", id).param("format", "gif"))
			.andExpect(status().isBadRequest())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.errors[0].field").value("format"));
	}

	@Test
	void malformedIdIs400() throws Exception {
		mvc.perform(get("/api/cards/not-a-uuid/barcode"))
			.andExpect(status().isBadRequest())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
	}

	@Test
	void unrenderableNumberIs422WithoutTheNumber() throws Exception {
		LoyaltyCard card = cardWithVersion(1);
		when(service.get(id)).thenReturn(card);
		when(barcodes.render(card, ImageFormat.PNG)).thenThrow(new BarcodeNotRenderableException(id, null));

		mvc.perform(get("/api/cards/{id}/barcode", id))
			.andExpect(status().isUnprocessableContent())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.status").value(422))
			.andExpect(jsonPath("$.instance").value("/api/cards/" + id + "/barcode"))
			.andExpect(content().string(not(containsString("1234567890"))));
	}

	private LoyaltyCard cardWithVersion(long version) {
		LoyaltyCard card = CardTestData.card(id, "Shop");
		ReflectionTestUtils.setField(card, "version", version);
		return card;
	}

}
