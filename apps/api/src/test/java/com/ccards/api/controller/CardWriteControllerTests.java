package com.ccards.api.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MockMvcTester.MockMvcRequestBuilder;

import com.ccards.api.error.GlobalExceptionHandler;
import com.ccards.api.repository.LoyaltyCard;
import com.ccards.api.service.CardNotFoundException;
import com.ccards.api.service.BarcodeService;
import com.ccards.api.service.CardService;
import com.ccards.api.service.InvalidPatchException;

@WebMvcTest(controllers = CardController.class, properties = "spring.datasource.url=jdbc:unused")
@Import({ GlobalExceptionHandler.class, CardMapperImpl.class })
class CardWriteControllerTests {

	private static final MediaType MERGE_PATCH = MediaType.valueOf("application/merge-patch+json");

	private static final UUID ID = UUID.randomUUID();

	@Autowired
	private MockMvcTester mvc;

	@MockitoBean
	private CardService service;

	@MockitoBean
	private BarcodeService barcodes;

	private LoyaltyCard storedCard() {
		LoyaltyCard card = CardTestData.card(ID, "Groceries");
		ReflectionTestUtils.setField(card, "version", 0L);
		return card;
	}

	private MockMvcRequestBuilder patch(String body) {
		return mvc.patch().uri("/api/cards/{id}", ID).contentType(MERGE_PATCH).content(body);
	}

	@Test
	void createReturns201WithLocationAndBody() {
		given(service.create(any())).willReturn(storedCard());

		assertThat(mvc.post().uri("/api/cards").contentType(MediaType.APPLICATION_JSON).content("""
				{"name":"Groceries","store":"Delhaize","cardNumber":"4006381333931","barcodeType":"EAN_13"}"""))
			.hasStatus(201)
			.headers().hasValue("Location", "http://localhost/api/cards/" + ID);
	}

	@Test
	void createWithMissingFieldsListsEveryField() {
		assertThat(mvc.post().uri("/api/cards").contentType(MediaType.APPLICATION_JSON).content("""
				{"cardNumber":"1","barcodeType":"EAN_13"}"""))
			.hasStatus(400)
			.hasContentType(MediaType.APPLICATION_PROBLEM_JSON)
			.bodyJson()
			.extractingPath("$.errors[*].field").asArray().contains("name", "store");
	}

	@Test
	void createWithTooLongNameIsRejected() {
		assertThat(mvc.post().uri("/api/cards").contentType(MediaType.APPLICATION_JSON).content("""
				{"name":"%s","store":"s","cardNumber":"1","barcodeType":"CODE_128"}""".formatted("x".repeat(101))))
			.hasStatus(400)
			.bodyJson().extractingPath("$.errors[0].field").isEqualTo("name");
	}

	@Test
	void patchReturns200() {
		given(service.patch(eq(ID), any())).willReturn(storedCard());

		assertThat(patch("""
				{"version":0,"name":"Renamed"}""")).hasStatus(200)
			.bodyJson().extractingPath("$.version").isEqualTo(0);
	}

	@Test
	void patchWithPlainJsonIs415() {
		assertThat(mvc.patch().uri("/api/cards/{id}", ID).contentType(MediaType.APPLICATION_JSON).content("{}"))
			.hasStatus(415)
			.hasContentType(MediaType.APPLICATION_PROBLEM_JSON);
	}

	@Test
	void patchOfUnknownCardIs404Problem() {
		given(service.patch(eq(ID), any())).willThrow(new CardNotFoundException(ID));

		assertThat(patch("{\"version\":0}")).hasStatus(404).hasContentType(MediaType.APPLICATION_PROBLEM_JSON);
	}

	@Test
	void staleVersionIs409ProblemWithoutInternals() {
		given(service.patch(eq(ID), any())).willThrow(new ObjectOptimisticLockingFailureException(LoyaltyCard.class, ID));

		assertThat(patch("{\"version\":0}")).hasStatus(409)
			.hasContentType(MediaType.APPLICATION_PROBLEM_JSON)
			.bodyJson().extractingPath("$.detail").asString().doesNotContain("LoyaltyCard");
	}

	@Test
	void unreadablePatchIs400WithFields() {
		given(service.patch(eq(ID), any())).willThrow(new InvalidPatchException(Map.of("version", "must be the integer version last read")));

		assertThat(patch("{}")).hasStatus(400)
			.bodyJson().extractingPath("$.errors[0].field").isEqualTo("version");
	}

	@Test
	void deleteReturns204() {
		assertThat(mvc.delete().uri("/api/cards/{id}", ID)).hasStatus(204);
	}

	@Test
	void deleteOfUnknownCardIs404Problem() {
		doThrow(new CardNotFoundException(ID)).when(service).delete(ID);

		assertThat(mvc.delete().uri("/api/cards/{id}", ID)).hasStatus(404)
			.hasContentType(MediaType.APPLICATION_PROBLEM_JSON);
	}

	@Test
	void usageReturns204WithoutBody() {
		assertThat(mvc.post().uri("/api/cards/{id}/usage", ID)).hasStatus(204).body().isEmpty();
		verify(service).recordUse(ID);
	}

	@Test
	void usageOfUnknownCardIs404Problem() {
		doThrow(new CardNotFoundException(ID)).when(service).recordUse(ID);

		assertThat(mvc.post().uri("/api/cards/{id}/usage", ID)).hasStatus(404)
			.hasContentType(MediaType.APPLICATION_PROBLEM_JSON);
	}

	@Test
	void usageWithAnInvalidIdIs400Problem() {
		assertThat(mvc.post().uri("/api/cards/{id}/usage", "not-a-uuid")).hasStatus(400)
			.hasContentType(MediaType.APPLICATION_PROBLEM_JSON);
	}

	@Test
	void markFavoriteReturns204WithoutBody() {
		assertThat(mvc.put().uri("/api/cards/{id}/favorite", ID)).hasStatus(204).body().isEmpty();
		verify(service).setFavorite(ID, true);
	}

	@Test
	void unmarkFavoriteReturns204WithoutBody() {
		assertThat(mvc.delete().uri("/api/cards/{id}/favorite", ID)).hasStatus(204).body().isEmpty();
		verify(service).setFavorite(ID, false);
	}

	@Test
	void favoriteOfUnknownCardIs404Problem() {
		doThrow(new CardNotFoundException(ID)).when(service).setFavorite(ID, true);

		assertThat(mvc.put().uri("/api/cards/{id}/favorite", ID)).hasStatus(404)
			.hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
	}

	@Test
	void favoriteWithAnInvalidIdIs400Problem() {
		assertThat(mvc.put().uri("/api/cards/{id}/favorite", "not-a-uuid")).hasStatus(400)
			.hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
		assertThat(mvc.delete().uri("/api/cards/{id}/favorite", "not-a-uuid")).hasStatus(400)
			.hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
	}

}
