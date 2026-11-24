package com.ccards.api.repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LoyaltyCardRepository extends JpaRepository<LoyaltyCard, UUID> {

	List<LoyaltyCard> findAllByOwnerId(UUID ownerId);

	/**
	 * Counts one use in a single statement, so concurrent uses are all counted. A bulk update skips entity
	 * versioning and auditing on purpose: a use is not an edit and must not change the version, the ETag or
	 * {@code updatedAt}. Returns the number of cards changed (0 when the id is unknown).
	 */
	@Modifying
	@Query("update LoyaltyCard c set c.usageCount = c.usageCount + 1, c.lastUsedAt = :now where c.id = :id")
	int recordUse(@Param("id") UUID id, @Param("now") Instant now);

}
