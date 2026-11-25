package com.ccards.api.service;

/** Thrown for a {@code sort} that is not a known {@link CardSort}. Mapped to a 400 problem. */
public class UnsupportedSortException extends RuntimeException {

	public UnsupportedSortException() {
		super("Unsupported card sort");
	}

}
