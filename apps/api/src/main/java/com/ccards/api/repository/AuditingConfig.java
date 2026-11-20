package com.ccards.api.repository;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Auditing needs the JPA metamodel, which only exists when a datasource is
 * configured. The default profile has none (see application.yml), so it must
 * not enable auditing. {@code @ConditionalOnBean(DataSource)} cannot be used:
 * user configuration is evaluated before the datasource auto-configuration.
 */
@Configuration
@ConditionalOnProperty("spring.datasource.url")
@EnableJpaAuditing
class AuditingConfig {

}
