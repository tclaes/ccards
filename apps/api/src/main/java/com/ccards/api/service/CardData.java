package com.ccards.api.service;

import com.ccards.api.repository.BarcodeType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * The editable fields of a card. Create and patch both end up here, so one set of
 * rules validates the full card, including a patch merged into the stored values.
 */
@ValidCardNumber
public record CardData(
		@NotBlank @Size(max = 100) String name,
		@NotBlank @Size(max = 100) String store,
		@NotBlank @Size(max = 100) String cardNumber,
		@NotNull BarcodeType barcodeType,
		@Size(max = 32) String color,
		@Size(max = 1000) String note) {
}
