/**
 * Data access: Spring Data repositories that load and store domain objects.
 * <p>
 * Repositories are used only by services. They contain no business rules.
 * <p>
 * Dependency direction: controller → service → repository, never the other
 * way round.
 */
package com.ccards.api.repository;
