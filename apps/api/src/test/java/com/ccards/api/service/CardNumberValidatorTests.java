package com.ccards.api.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import com.ccards.api.repository.BarcodeType;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;

class CardNumberValidatorTests {

	private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

	private Set<ConstraintViolation<CardData>> validate(BarcodeType type, String number) {
		return validator.validate(new CardData("Groceries", "Delhaize", number, type, null, null));
	}

	@ParameterizedTest
	@CsvSource({ "EAN_13,4006381333931", "EAN_8,96385074", "UPC_A,036000291452", "CODE_128,AB-1234", "QR_CODE,https://example.com/x?y=1" })
	void acceptsValidNumbers(BarcodeType type, String number) {
		assertThat(validate(type, number)).isEmpty();
	}

	@ParameterizedTest
	@CsvSource({
		"EAN_13,4006381333932", // wrong check digit
		"EAN_13,400638133393", // too short
		"EAN_8,963850740", // too long
		"UPC_A,03600029145A", // not digits
		"EAN_13,' 4006381333931'" // whitespace
	})
	void rejectsInvalidGs1Numbers(BarcodeType type, String number) {
		Set<ConstraintViolation<CardData>> violations = validate(type, number);

		assertThat(violations).singleElement()
			.satisfies(v -> assertThat(v.getPropertyPath()).hasToString("cardNumber"));
	}

	@Test
	void blankNumberIsReportedOnceByNotBlank() {
		assertThat(validate(BarcodeType.EAN_13, " ")).singleElement()
			.satisfies(v -> assertThat(v.getMessage()).isEqualTo("must not be blank"));
		assertThat(validate(BarcodeType.CODE_128, "")).hasSize(1);
	}

	@Test
	void missingBarcodeTypeIsReportedWithoutFailingOnTheNumber() {
		assertThat(validate(null, "4006381333931")).singleElement()
			.satisfies(v -> assertThat(v.getPropertyPath()).hasToString("barcodeType"));
	}

}
