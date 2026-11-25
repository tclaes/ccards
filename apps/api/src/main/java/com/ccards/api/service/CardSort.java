package com.ccards.api.service;

import java.util.Arrays;

import org.springframework.data.domain.Sort;

/** The orders the card list can be asked for. Favorites come first in every one. */
public enum CardSort {

	NAME("name"),
	LAST_USED("lastUsed", Sort.Order.desc("lastUsedAt").nullsLast()),
	MOST_USED("mostUsed", Sort.Order.desc("usageCount"));

	private final String parameterValue;

	private final Sort sort;

	CardSort(String parameterValue, Sort.Order... leading) {
		this.parameterValue = parameterValue;
		// Name settles ties; id keeps the order stable, so pages never overlap or skip cards.
		this.sort = Sort.by(Sort.Order.desc("favorite")).and(Sort.by(leading)).and(Sort.by("name", "id"));
	}

	/** Parses the {@code sort} query parameter. */
	public static CardSort fromParameter(String value) {
		return Arrays.stream(values())
			.filter(order -> order.parameterValue.equals(value))
			.findFirst()
			.orElseThrow(UnsupportedSortException::new);
	}

	public Sort sort() {
		return sort;
	}

}
