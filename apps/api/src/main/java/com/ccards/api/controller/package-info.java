/**
 * HTTP layer: {@code @RestController} classes that map requests to Java calls
 * and back to JSON.
 * <p>
 * Controllers validate input and delegate to the {@code service} package. They
 * hold no business logic and never talk to a repository directly.
 * <p>
 * Dependency direction: controller → service → repository, never the other
 * way round.
 */
package com.ccards.api.controller;
