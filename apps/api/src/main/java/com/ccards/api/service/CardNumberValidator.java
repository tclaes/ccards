package com.ccards.api.service;

import java.util.Map;

import com.ccards.api.repository.BarcodeType;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * EAN-13, EAN-8 and UPC-A are digits with a GS1 check digit; the other barcode types
 * take any text. Missing or blank values are left to {@code @NotBlank}/{@code @NotNull}.
 */
public class CardNumberValidator implements ConstraintValidator<ValidCardNumber, CardData> {

	private static final Map<BarcodeType, Integer> GS1_LENGTHS = Map.of(
			BarcodeType.EAN_13, 13,
			BarcodeType.EAN_8, 8,
			BarcodeType.UPC_A, 12);

	@Override
	public boolean isValid(CardData card, ConstraintValidatorContext context) {
		if (card.barcodeType() == null || card.cardNumber() == null || card.cardNumber().isBlank()) {
			return true;
		}
		Integer length = GS1_LENGTHS.get(card.barcodeType());
		if (length == null) {
			return true;
		}
		if (isGs1Number(card.cardNumber(), length)) {
			return true;
		}
		context.disableDefaultConstraintViolation();
		context.buildConstraintViolationWithTemplate(
				"must be " + length + " digits with a valid check digit for " + card.barcodeType())
			.addPropertyNode("cardNumber")
			.addConstraintViolation();
		return false;
	}

	private static boolean isGs1Number(String number, int length) {
		if (number.length() != length || !number.chars().allMatch(c -> c >= '0' && c <= '9')) {
			return false;
		}
		// Weights 3,1,3,1... from the digit left of the check digit, moving left.
		int sum = 0;
		for (int i = length - 2, weight = 3; i >= 0; i--, weight = 4 - weight) {
			sum += (number.charAt(i) - '0') * weight;
		}
		int checkDigit = (10 - sum % 10) % 10;
		return checkDigit == number.charAt(length - 1) - '0';
	}

}
