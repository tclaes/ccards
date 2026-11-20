package com.ccards.api.error;

import com.ccards.api.WithoutDatabase;
import static org.assertj.core.api.Assertions.assertThat;

import com.ccards.errortest.ErrorTestController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.springframework.test.web.servlet.client.RestTestClient.ResponseSpec;

/** Every failure comes back as RFC 9457 {@code application/problem+json}. */
@WithoutDatabase
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
@Import(ErrorTestController.class)
class ErrorHandlingTests {

	private static final MediaType PROBLEM_JSON = MediaType.APPLICATION_PROBLEM_JSON;

	@Autowired
	private RestTestClient client;

	private ResponseSpec post(String body) {
		return client.post().uri("/test-errors/body")
			.contentType(MediaType.APPLICATION_JSON)
			.body(body)
			.exchange();
	}

	@Test
	void unknownPathIsProblem404() {
		client.get().uri("/does-not-exist").exchange()
			.expectStatus().isNotFound()
			.expectHeader().contentType(PROBLEM_JSON)
			.expectBody().jsonPath("$.status").isEqualTo(404)
			.jsonPath("$.title").isEqualTo("Not Found")
			.jsonPath("$.instance").isEqualTo("/does-not-exist");
	}

	@Test
	void unsupportedMethodIsProblem405() {
		client.put().uri("/test-errors/boom").exchange()
			.expectStatus().isEqualTo(405)
			.expectHeader().contentType(PROBLEM_JSON)
			.expectBody().jsonPath("$.status").isEqualTo(405);
	}

	@Test
	void malformedJsonIsProblem400WithoutParserInternals() {
		byte[] body = post("{not json").expectStatus().isBadRequest()
			.expectHeader().contentType(PROBLEM_JSON)
			.expectBody().jsonPath("$.status").isEqualTo(400)
			.returnResult().getResponseBody();

		assertThat(new String(body)).doesNotContain("line:").doesNotContain("Jackson");
	}

	@Test
	void oneInvalidFieldIsListedWithNameAndMessage() {
		post("{\"title\":\"\",\"count\":1}").expectStatus().isBadRequest()
			.expectHeader().contentType(PROBLEM_JSON)
			.expectBody()
			.jsonPath("$.status").isEqualTo(400)
			.jsonPath("$.errors.length()").isEqualTo(1)
			.jsonPath("$.errors[0].field").isEqualTo("title")
			.jsonPath("$.errors[0].message").isNotEmpty();
	}

	@Test
	void everyInvalidFieldIsListed() {
		post("{\"title\":\"\",\"count\":0}").expectStatus().isBadRequest()
			.expectBody()
			.jsonPath("$.errors.length()").isEqualTo(2)
			.jsonPath("$.errors[?(@.field=='title')]").exists()
			.jsonPath("$.errors[?(@.field=='count')]").exists();
	}

	@Test
	void invalidQueryParameterIsNamed() {
		client.get().uri("/test-errors/param?limit=0").exchange()
			.expectStatus().isBadRequest()
			.expectHeader().contentType(PROBLEM_JSON)
			.expectBody()
			.jsonPath("$.errors.length()").isEqualTo(1)
			.jsonPath("$.errors[0].field").isEqualTo("limit")
			.jsonPath("$.errors[0].message").isNotEmpty();
	}

	@Test
	void unexpectedExceptionIsGeneric500() {
		byte[] body = client.get().uri("/test-errors/boom").exchange()
			.expectStatus().is5xxServerError()
			.expectHeader().contentType(PROBLEM_JSON)
			.expectBody().jsonPath("$.status").isEqualTo(500)
			.returnResult().getResponseBody();

		assertThat(new String(body)).doesNotContain("secret internals")
			.doesNotContain("IllegalStateException");
	}

}
