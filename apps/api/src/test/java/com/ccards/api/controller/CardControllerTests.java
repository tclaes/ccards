package com.ccards.api.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.ccards.api.error.GlobalExceptionHandler;
import com.ccards.api.repository.LoyaltyCard;
import com.ccards.api.service.CardNotFoundException;
import com.ccards.api.service.CardService;

/** Web layer only: the service is mocked, so no database or Docker is needed. */
@WebMvcTest(controllers = CardController.class, properties = "spring.datasource.url=jdbc:unused")
@Import({ GlobalExceptionHandler.class, CardMapperImpl.class })
class CardControllerTests {

	private static final MediaType PROBLEM_JSON = MediaType.APPLICATION_PROBLEM_JSON;

	@Autowired
	private MockMvc mvc;

	@MockitoBean
	private CardService service;

	@Test
	void listsTheFirstPageWithDefaultsAndFixedOrder() throws Exception {
		UUID id = UUID.randomUUID();
		LoyaltyCard card = CardTestData.card(id, "Albert Heijn");
		when(service.list(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(card), PageRequest.of(0, 20), 25));

		mvc.perform(get("/api/cards"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.content.length()").value(1))
			.andExpect(jsonPath("$.content[0].id").value(id.toString()))
			.andExpect(jsonPath("$.content[0].name").value("Albert Heijn"))
			.andExpect(jsonPath("$.content[0].barcodeType").value("EAN_13"))
			.andExpect(jsonPath("$.page").value(0))
			.andExpect(jsonPath("$.size").value(20))
			.andExpect(jsonPath("$.totalElements").value(25))
			.andExpect(jsonPath("$.totalPages").value(2));

		ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
		verify(service).list(captor.capture());
		Pageable requested = captor.getValue();
		assertThat(requested.getPageNumber()).isZero();
		assertThat(requested.getPageSize()).isEqualTo(20);
		assertThat(requested.getSort()).isEqualTo(Sort.by("name", "id"));
	}

	@Test
	void passesExplicitPageAndSizeToTheService() throws Exception {
		Pageable pageable = PageRequest.of(1, 5, Sort.by("name", "id"));
		when(service.list(eq(pageable))).thenReturn(new PageImpl<>(List.of(), pageable, 5));

		mvc.perform(get("/api/cards?page=1&size=5"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.page").value(1))
			.andExpect(jsonPath("$.size").value(5));
	}

	@Test
	void emptyListHasZeroTotals() throws Exception {
		when(service.list(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 20), 0));

		mvc.perform(get("/api/cards"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.content.length()").value(0))
			.andExpect(jsonPath("$.totalElements").value(0))
			.andExpect(jsonPath("$.totalPages").value(0));
	}

	@Test
	void invalidPageParametersAreProblem400() throws Exception {
		for (String query : List.of("size=0", "size=101", "page=-1")) {
			String name = query.substring(0, query.indexOf('='));
			mvc.perform(get("/api/cards?" + query))
				.andExpect(status().isBadRequest())
				.andExpect(content().contentTypeCompatibleWith(PROBLEM_JSON))
				.andExpect(jsonPath("$.errors[0].field").value(name));
		}
	}

	@Test
	void returnsOneCardById() throws Exception {
		UUID id = UUID.randomUUID();
		LoyaltyCard card = CardTestData.card(id, "Colruyt");
		card.setColor("#ff0000");
		when(service.get(id)).thenReturn(card);

		mvc.perform(get("/api/cards/{id}", id))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.id").value(id.toString()))
			.andExpect(jsonPath("$.color").value("#ff0000"))
			.andExpect(jsonPath("$.createdAt").exists())
			.andExpect(jsonPath("$.updatedAt").exists());
	}

	@Test
	void doesNotExposeTheOwner() throws Exception {
		UUID id = UUID.randomUUID();
		when(service.get(id)).thenReturn(CardTestData.card(id, "Colruyt"));
		when(service.list(any(Pageable.class)))
			.thenReturn(new PageImpl<>(List.of(CardTestData.card(id, "Colruyt")), PageRequest.of(0, 20), 1));

		mvc.perform(get("/api/cards/{id}", id))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.ownerId").doesNotExist());
		mvc.perform(get("/api/cards"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.content[0].ownerId").doesNotExist());
	}

	@Test
	void unknownIdIsProblem404WithoutLeakingTheExceptionMessage() throws Exception {
		UUID id = UUID.randomUUID();
		when(service.get(id)).thenThrow(new CardNotFoundException(id));

		mvc.perform(get("/api/cards/{id}", id))
			.andExpect(status().isNotFound())
			.andExpect(content().contentTypeCompatibleWith(PROBLEM_JSON))
			.andExpect(jsonPath("$.status").value(404))
			.andExpect(jsonPath("$.detail").value("Card not found."))
			.andExpect(jsonPath("$.instance").value("/api/cards/" + id));
	}

	@Test
	void malformedIdIsProblem400() throws Exception {
		mvc.perform(get("/api/cards/not-a-uuid"))
			.andExpect(status().isBadRequest())
			.andExpect(content().contentTypeCompatibleWith(PROBLEM_JSON));
	}

}
