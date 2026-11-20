package com.ccards.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.test.web.servlet.client.RestTestClient;

/** Swagger UI renders the contract file, in the default profile, without a database. */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
class SwaggerUiTests {

	@Autowired
	private RestTestClient client;

	@Test
	void swaggerUiPageIsServed() {
		String html = client.get().uri("/swagger-ui/index.html")
			.exchange()
			.expectStatus().isOk()
			.expectBody(String.class).returnResult().getResponseBody();
		assertThat(html).containsIgnoringCase("swagger");
	}

	@Test
	void swaggerUiEntryPointRedirectsToThePage() {
		client.get().uri("/swagger-ui")
			.exchange()
			.expectStatus().is3xxRedirection();
	}

	@Test
	void servedContractIsTheContractFile() throws Exception {
		String served = client.get().uri("/api-docs/openapi.yaml")
			.exchange()
			.expectStatus().isOk()
			.expectBody(String.class).returnResult().getResponseBody();
		String source = Files.readString(Path.of("../../libs/api-contract/openapi.yaml"));
		assertThat(served).isEqualTo(source);
		assertThat(served).contains("/api/health");
	}

}
