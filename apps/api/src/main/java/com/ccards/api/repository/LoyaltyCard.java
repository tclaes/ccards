package com.ccards.api.repository;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "loyalty_card")
@EntityListeners(AuditingEntityListener.class)
public class LoyaltyCard {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	/** Optimistic locking: Hibernate increments it on every update and rejects a stale write. */
	@Version
	private Long version;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false)
	private String store;

	@Column(nullable = false)
	private String cardNumber;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private BarcodeType barcodeType;

	private String color;

	private String note;

	/** Plain id, not a relation: sharing (CC-29/CC-30) must not depend on a one-to-one owner link. */
	@Column(nullable = false)
	private UUID ownerId;

	@CreatedDate
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@LastModifiedDate
	@Column(nullable = false)
	private Instant updatedAt;

	/**
	 * Read-only on purpose: only {@link LoyaltyCardRepository#recordUse} changes it, atomically in the database.
	 * Hibernate writes every mapped column on update, so a writable mapping would put a stale count back when
	 * a card is edited.
	 */
	@Column(nullable = false, insertable = false, updatable = false)
	private long usageCount;

	@Column(insertable = false, updatable = false)
	private Instant lastUsedAt;

	protected LoyaltyCard() {
		// for JPA
	}

	public LoyaltyCard(String name, String store, String cardNumber, BarcodeType barcodeType, UUID ownerId) {
		this.name = name;
		this.store = store;
		this.cardNumber = cardNumber;
		this.barcodeType = barcodeType;
		this.ownerId = ownerId;
	}

	public UUID getId() { return id; }

	public Long getVersion() { return version; }

	public String getName() { return name; }

	public void setName(String name) { this.name = name; }

	public String getStore() { return store; }

	public void setStore(String store) { this.store = store; }

	public String getCardNumber() { return cardNumber; }

	public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }

	public BarcodeType getBarcodeType() { return barcodeType; }

	public void setBarcodeType(BarcodeType barcodeType) { this.barcodeType = barcodeType; }

	public String getColor() { return color; }

	public void setColor(String color) { this.color = color; }

	public String getNote() { return note; }

	public void setNote(String note) { this.note = note; }

	public UUID getOwnerId() { return ownerId; }

	public Instant getCreatedAt() { return createdAt; }

	public Instant getUpdatedAt() { return updatedAt; }

	public long getUsageCount() { return usageCount; }

	public Instant getLastUsedAt() { return lastUsedAt; }

}
