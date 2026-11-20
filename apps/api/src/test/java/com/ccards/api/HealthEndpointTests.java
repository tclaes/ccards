package com.ccards.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.test.json.JsonCompareMode;
import org.springframework.test.web.servlet.client.RestTestClient;

/**
 * Starts the whole application on a random port (so it does not clash with a
 * running {@code nx serve api}) and calls it over real HTTP.
 */
@WithoutDatabase
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
class HealthEndpointTests {

	@Autowired
	private RestTestClient client;

	@Test
	void healthReportsUpWithoutDetails() {
		client.get().uri("/api/health")
			.exchange()
			.expectStatus().isOk()
			.expectBody().json("""
				{"status":"UP"}
				""", JsonCompareMode.STRICT);
	}

	@Test
	void otherManagementEndpointsAreNotExposed() {
		client.get().uri("/api").exchange().expectStatus().isNotFound();
		client.get().uri("/api/env").exchange().expectStatus().isNotFound();
		client.get().uri("/actuator/env").exchange().expectStatus().isNotFound();
	}

}
