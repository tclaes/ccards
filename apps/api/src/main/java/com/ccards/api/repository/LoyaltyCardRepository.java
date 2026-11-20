package com.ccards.api.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LoyaltyCardRepository extends JpaRepository<LoyaltyCard, UUID> {

	List<LoyaltyCard> findAllByOwnerId(UUID ownerId);

}
