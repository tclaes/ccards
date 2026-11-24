package com.ccards.api.service;

/** Thrown for a {@code format} that is not a known {@link ImageFormat}. Mapped to a 400 problem. */
public class UnsupportedFormatException extends RuntimeException {

	public UnsupportedFormatException() {
		super("Unsupported image format");
	}

}
