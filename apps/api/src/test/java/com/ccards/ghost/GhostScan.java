package com.ccards.ghost;

import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.context.annotation.Configuration;

/** Registers {@link GhostEntity}; kept out of {@code com.ccards.api} so it is only used on purpose. */
@Configuration
@EntityScan("com.ccards.ghost")
public class GhostScan {

}
