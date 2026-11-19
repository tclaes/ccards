/**
 * Business logic: {@code @Service} classes that implement the use cases and own
 * transaction boundaries.
 * <p>
 * Services are called by controllers and use repositories for data access.
 * They know nothing about HTTP.
 * <p>
 * Dependency direction: controller → service → repository, never the other
 * way round.
 */
package com.ccards.api.service;
