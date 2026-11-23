package com.ccards.api.service;

import java.util.Map;

/** A merge-patch body that cannot be applied (wrong shape, type or unknown field); maps to 400. */
public class InvalidPatchException extends RuntimeException {

	private final transient Map<String, String> violations;

	public InvalidPatchException(Map<String, String> violations) {
		super("Invalid patch: " + violations.keySet());
		this.violations = violations;
	}

	/** Field name to message. */
	public Map<String, String> getViolations() {
		return violations;
	}

}
