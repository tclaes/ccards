package com.ccards.api.service;

import java.util.UUID;

/** Thrown when a card id does not exist. Mapped to a 404 problem in {@code GlobalExceptionHandler}. */
public class CardNotFoundException extends RuntimeException {

	public CardNotFoundException(UUID id) {
		super("Card " + id + " not found");
	}

}
