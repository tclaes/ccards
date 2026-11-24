package com.ccards.api.service;

import java.util.Locale;

/** The image formats a barcode can be drawn in. */
public enum ImageFormat {

	PNG, SVG;

	/** Parses the {@code format} query parameter, ignoring case. */
	public static ImageFormat fromParameter(String value) {
		try {
			return valueOf(value.toUpperCase(Locale.ROOT));
		}
		catch (IllegalArgumentException ex) {
			throw new UnsupportedFormatException();
		}
	}

	/** Lower-case name, as used in the query parameter and in ETags. */
	public String parameterValue() {
		return name().toLowerCase(Locale.ROOT);
	}

}
