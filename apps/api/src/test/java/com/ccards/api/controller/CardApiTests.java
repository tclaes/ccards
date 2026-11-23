package com.ccards.api.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.springframework.test.web.servlet.client.RestTestClient.ResponseSpec;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * The card write endpoints against the real migrations on a throwaway PostgreSQL.
 * Skipped (not failed) when Docker is unavailable.
 */
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("local") // the default profile has no datasource; @ServiceConnection swaps in the container URL
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
class CardApiTests {

	private static final MediaType MERGE_PATCH = MediaType.valueOf("application/merge-patch+json");

	@Container
	@ServiceConnection
	static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17");

	@Autowired
	private RestTestClient client;

	@Autowired
	private JdbcTemplate jdbc;

	private ResponseSpec create(String body) {
		return client.post().uri("/api/cards").contentType(MediaType.APPLICATION_JSON).body(body).exchange();
	}

	private ResponseSpec patch(String id, String body) {
		return client.patch().uri("/api/cards/{id}", id).contentType(MERGE_PATCH).body(body).exchange();
	}

	private String createGroceries() {
		return created(create("""
				{"name":"Groceries","store":"Delhaize","cardNumber":"4006381333931","barcodeType":"EAN_13",
				 "color":"#ff0000","note":"A note"}"""));
	}

	private String created(ResponseSpec response) {
		Map<?, ?> body = response.expectStatus().isCreated().expectBody(Map.class).returnResult().getResponseBody();
		return (String) body.get("id");
	}

	private Integer rows(String id) {
		return jdbc.queryForObject("select count(*) from loyalty_card where id = ?", Integer.class, UUID.fromString(id));
	}

	@Test
	void createdCardIsStored() {
		ResponseSpec response = create("""
				{"name":"Groceries","store":"Delhaize","cardNumber":"4006381333931","barcodeType":"EAN_13",
				 "ownerId":"11111111-1111-1111-1111-111111111111"}""");

		String id = created(response);

		assertThat(rows(id)).isEqualTo(1);
		assertThat(jdbc.queryForObject("select owner_id from loyalty_card where id = ?", UUID.class, UUID.fromString(id)))
			.isEqualTo(UUID.fromString("00000000-0000-0000-0000-000000000001"));
	}

	@Test
	void createRejectsAnInvalidCheckDigitOnTheCardNumber() {
		create("""
				{"name":"n","store":"s","cardNumber":"4006381333932","barcodeType":"EAN_13"}""")
			.expectStatus().isBadRequest()
			.expectBody().jsonPath("$.errors[0].field").isEqualTo("cardNumber");
	}

	@Test
	void createWithoutBarcodeTypeIsBadRequestNotServerError() {
		create("""
				{"name":"n","store":"s","cardNumber":"4006381333932"}""")
			.expectStatus().isBadRequest()
			.expectBody().jsonPath("$.errors[0].field").isEqualTo("barcodeType");
	}

	@Test
	void patchChangesOnlyTheSentFieldsAndBumpsTheVersion() {
		String id = createGroceries();

		patch(id, """
				{"version":0,"name":"Renamed"}""")
			.expectStatus().isOk()
			.expectBody()
			.jsonPath("$.name").isEqualTo("Renamed")
			.jsonPath("$.store").isEqualTo("Delhaize")
			.jsonPath("$.note").isEqualTo("A note")
			.jsonPath("$.version").isEqualTo(1);
	}

	@Test
	void patchWithNullClearsAnOptionalField() {
		String id = createGroceries();

		patch(id, """
				{"version":0,"note":null}""")
			.expectStatus().isOk()
			.expectBody().jsonPath("$.note").doesNotExist();
	}

	@Test
	void patchWithNullOnARequiredFieldIsRejected() {
		String id = createGroceries();

		patch(id, """
				{"version":0,"name":null}""")
			.expectStatus().isBadRequest()
			.expectBody().jsonPath("$.errors[0].field").isEqualTo("name");
	}

	@Test
	void patchThatMakesTheMergedCardInvalidIsRejectedAndStoresNothing() {
		String id = createGroceries();

		// The stored EAN-13 number is not a valid EAN-8.
		patch(id, """
				{"version":0,"barcodeType":"EAN_8"}""")
			.expectStatus().isBadRequest()
			.expectBody().jsonPath("$.errors[0].field").isEqualTo("cardNumber");

		assertThat(jdbc.queryForObject("select barcode_type from loyalty_card where id = ?", String.class,
				UUID.fromString(id))).isEqualTo("EAN_13");
	}

	@Test
	void secondEditWithTheOldVersionGets409AndChangesNothing() {
		String id = createGroceries();
		patch(id, """
				{"version":0,"name":"First"}""").expectStatus().isOk();

		patch(id, """
				{"version":0,"name":"Second"}""")
			.expectStatus().isEqualTo(409)
			.expectHeader().contentType(MediaType.APPLICATION_PROBLEM_JSON);

		assertThat(jdbc.queryForObject("select name from loyalty_card where id = ?", String.class, UUID.fromString(id)))
			.isEqualTo("First");
	}

	@Test
	void patchOfUnknownIdIs404() {
		patch(UUID.randomUUID().toString(), """
				{"version":0}""").expectStatus().isNotFound();
	}

	@Test
	void deleteRemovesTheCardAndASecondDeleteIs404() {
		String id = createGroceries();

		client.delete().uri("/api/cards/{id}", id).exchange().expectStatus().isNoContent();
		assertThat(rows(id)).isZero();
		client.delete().uri("/api/cards/{id}", id).exchange().expectStatus().isNotFound();
	}

}
