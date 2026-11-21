package com.ccards.api.controller;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

import com.ccards.api.generated.model.Card;
import com.ccards.api.repository.LoyaltyCard;

/** Entity to wire DTO. Fails the build when the contract gains a field the entity cannot fill. */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface CardMapper {

	Card toCard(LoyaltyCard card);

	default OffsetDateTime toOffsetDateTime(Instant instant) {
		return instant == null ? null : instant.atOffset(ZoneOffset.UTC);
	}

}
