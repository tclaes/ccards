package com.ccards.api.service;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.ccards.api.repository.BarcodeType;

import tools.jackson.databind.JsonNode;

/**
 * Reads a JSON Merge Patch (RFC 7396) body: a field that is absent keeps its value, a
 * {@code null} clears it, anything else replaces it. Shape and type problems are
 * collected; value rules (blank, length, card number) are left to {@link CardData}.
 */
@Component
class CardPatchReader {

	private static final Set<String> FIELDS = Set.of("name", "store", "cardNumber", "barcodeType", "color", "note",
			"version");

	/** The patch's version, and the card with the patch merged into {@code current}. */
	record Patch(long version, CardData merged) {
	}

	Patch read(JsonNode body, CardData current) {
		if (!body.isObject()) {
			throw new InvalidPatchException(Map.of("body", "must be a JSON object"));
		}
		Map<String, String> violations = new LinkedHashMap<>();
		body.propertyNames()
			.stream()
			.filter(name -> !FIELDS.contains(name))
			.forEach(name -> violations.put(name, "is not a known field"));

		JsonNode versionNode = body.get("version");
		if (versionNode == null || !versionNode.canConvertToLong() || !versionNode.isIntegralNumber()) {
			violations.put("version", "must be the integer version last read");
		}
		CardData merged = new CardData(
				text(body, "name", current.name(), violations),
				text(body, "store", current.store(), violations),
				text(body, "cardNumber", current.cardNumber(), violations),
				barcodeType(body, current.barcodeType(), violations),
				text(body, "color", current.color(), violations),
				text(body, "note", current.note(), violations));
		if (!violations.isEmpty()) {
			throw new InvalidPatchException(violations);
		}
		return new Patch(versionNode.longValue(), merged);
	}

	private static String text(JsonNode body, String field, String current, Map<String, String> violations) {
		JsonNode node = body.get(field);
		if (node == null) {
			return current;
		}
		if (node.isNull()) {
			return null;
		}
		if (!node.isString()) {
			violations.put(field, "must be a string");
			return current;
		}
		return node.stringValue();
	}

	private static BarcodeType barcodeType(JsonNode body, BarcodeType current, Map<String, String> violations) {
		JsonNode node = body.get("barcodeType");
		if (node == null) {
			return current;
		}
		if (node.isNull()) {
			return null;
		}
		if (!node.isString()) {
			violations.put("barcodeType", "must be a string");
			return current;
		}
		try {
			return BarcodeType.valueOf(node.stringValue());
		}
		catch (IllegalArgumentException ex) {
			violations.put("barcodeType", "must be one of " + Arrays.toString(BarcodeType.values()));
			return current;
		}
	}

}
