package com.ccards.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import com.ccards.api.repository.BarcodeType;

import tools.jackson.databind.json.JsonMapper;

class CardPatchReaderTests {

	private static final CardData CURRENT = new CardData("Groceries", "Delhaize", "4006381333931",
			BarcodeType.EAN_13, "#ff0000", "A note");

	private final CardPatchReader reader = new CardPatchReader();

	private final JsonMapper json = JsonMapper.builder().build();

	private CardPatchReader.Patch read(String body) {
		return reader.read(json.readTree(body), CURRENT);
	}

	@Test
	void absentFieldsAreKept() {
		CardPatchReader.Patch patch = read("""
				{"version": 3, "name": "Renamed"}""");

		assertThat(patch.version()).isEqualTo(3);
		assertThat(patch.merged()).isEqualTo(new CardData("Renamed", "Delhaize", "4006381333931", BarcodeType.EAN_13,
				"#ff0000", "A note"));
	}

	@Test
	void nullClearsAField() {
		CardData merged = read("""
				{"version": 0, "note": null, "color": null}""").merged();

		assertThat(merged.note()).isNull();
		assertThat(merged.color()).isNull();
	}

	@Test
	void nullOnARequiredFieldIsMergedAndLeftToValidation() {
		assertThat(read("""
				{"version": 0, "name": null}""").merged().name()).isNull();
	}

	@Test
	void barcodeTypeIsParsed() {
		assertThat(read("""
				{"version": 0, "barcodeType": "QR_CODE"}""").merged().barcodeType()).isEqualTo(BarcodeType.QR_CODE);
	}

	@Test
	void everyProblemIsReportedTogether() {
		assertThatThrownBy(() -> read("""
				{"name": 5, "barcodeType": "MORSE", "ownerId": "x"}"""))
			.isInstanceOfSatisfying(InvalidPatchException.class, ex -> assertThat(ex.getViolations())
				.containsOnlyKeys("name", "barcodeType", "ownerId", "version"));
	}

	@Test
	void barcodeTypeMustBeAString() {
		assertThatThrownBy(() -> read("""
				{"version": 0, "barcodeType": []}"""))
			.isInstanceOfSatisfying(InvalidPatchException.class,
					ex -> assertThat(ex.getViolations()).containsOnlyKeys("barcodeType"));
	}

	@Test
	void versionMustBeAnInteger() {
		assertThatThrownBy(() -> read("""
				{"version": "3"}"""))
			.isInstanceOfSatisfying(InvalidPatchException.class,
					ex -> assertThat(ex.getViolations()).containsOnlyKeys("version"));
		assertThatThrownBy(() -> read("""
				{"version": 1.5}"""))
			.isInstanceOf(InvalidPatchException.class);
	}

	@Test
	void bodyMustBeAnObject() {
		assertThatThrownBy(() -> read("[1]"))
			.isInstanceOfSatisfying(InvalidPatchException.class,
					ex -> assertThat(ex.getViolations()).containsOnlyKeys("body"));
	}

}
