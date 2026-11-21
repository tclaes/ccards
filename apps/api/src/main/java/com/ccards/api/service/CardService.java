package com.ccards.api.service;

import java.util.UUID;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ccards.api.repository.LoyaltyCard;
import com.ccards.api.repository.LoyaltyCardRepository;

@ConditionalOnProperty("spring.datasource.url") // no database in the default profile, so no cards
@Service
@Transactional(readOnly = true)
public class CardService {

	private final LoyaltyCardRepository repository;

	public CardService(LoyaltyCardRepository repository) {
		this.repository = repository;
	}

	public Page<LoyaltyCard> list(Pageable pageable) {
		return repository.findAll(pageable);
	}

	public LoyaltyCard get(UUID id) {
		return repository.findById(id).orElseThrow(() -> new CardNotFoundException(id));
	}

}
