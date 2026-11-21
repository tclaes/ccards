package com.ccards.api.error;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.client.RestTestClient;

/** Unmapped paths under the Actuator base path ({@code /api}) also answer with problem+json. */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
class ActuatorPathErrorTests {

	@Autowired
	private RestTestClient client;

	@Test
	void unmappedApiPathIsProblem404() {
		client.get().uri("/api/unknown").exchange()
			.expectStatus().isNotFound()
			.expectHeader().contentType(MediaType.APPLICATION_PROBLEM_JSON)
			.expectBody().jsonPath("$.status").isEqualTo(404);
	}

}
