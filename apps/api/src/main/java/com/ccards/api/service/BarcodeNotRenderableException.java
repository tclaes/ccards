package com.ccards.api.service;

import java.util.UUID;

/**
 * Thrown when a card's number cannot be drawn as its barcode type. Mapped to a 422 problem in
 * {@code GlobalExceptionHandler}; the message names the card for the log only.
 */
public class BarcodeNotRenderableException extends RuntimeException {

	public BarcodeNotRenderableException(UUID cardId, Throwable cause) {
		super("Card " + cardId + " cannot be drawn as a barcode", cause);
	}

}
