package com.ccards.api.error;

import com.ccards.api.WithoutDatabase;
import static org.assertj.core.api.Assertions.assertThat;

import com.ccards.api.generated.model.Problem;
import com.ccards.api.generated.model.ValidationProblem;
import com.ccards.errortest.ErrorTestController;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.client.RestTestClient;
import tools.jackson.databind.json.JsonMapper;

/** The real error JSON has only members the OpenAPI contract declares (`type` is omitted for about:blank). */
@WithoutDatabase
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
@Import(ErrorTestController.class)
class ProblemContractTests {

	private final JsonMapper json = JsonMapper.builder().build();

	@Autowired
	private RestTestClient client;

	@Test
	void validationErrorMatchesValidationProblemSchema() throws Exception {
		String body = client.post().uri("/test-errors/body")
			.contentType(MediaType.APPLICATION_JSON)
			.body("{\"title\":\"\",\"count\":1}")
			.exchange().expectStatus().isBadRequest()
			.expectBody(String.class).returnResult().getResponseBody();

		assertThat(members(body)).containsExactlyInAnyOrder("title", "status", "detail", "instance", "errors");
		ValidationProblem problem = json.readValue(body, ValidationProblem.class);
		assertThat(problem.getStatus()).isEqualTo(400);
		assertThat(problem.getErrors()).singleElement()
			.satisfies(e -> assertThat(e.getField()).isEqualTo("title"));
	}

	@Test
	void serverErrorMatchesProblemSchema() throws Exception {
		String body = client.get().uri("/test-errors/boom")
			.exchange().expectStatus().is5xxServerError()
			.expectBody(String.class).returnResult().getResponseBody();

		assertThat(members(body)).containsExactlyInAnyOrder("title", "status", "detail", "instance");
		Problem problem = json.readValue(body, Problem.class);
		assertThat(problem.getStatus()).isEqualTo(500);
	}

	@SuppressWarnings("unchecked")
	private java.util.Set<String> members(String body) throws Exception {
		return json.readValue(body, Map.class).keySet();
	}

}
