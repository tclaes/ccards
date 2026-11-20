package com.ccards.ghost;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

/**
 * Maps to a table no migration creates. Lives outside {@code com.ccards.api}
 * so the normal component/entity scan never picks it up; only
 * {@code FlywayMigrationTests} registers it on purpose.
 */
@Entity
public class GhostEntity {

	@Id
	private Long id;

}
