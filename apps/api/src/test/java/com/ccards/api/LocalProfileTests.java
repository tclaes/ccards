package com.ccards.api;

import static org.assertj.core.api.Assertions.assertThat;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;

/**
 * Checks the wiring of the {@code local} profile without needing Docker: the
 * datasource and mail settings point at the compose stack, but no connection
 * is opened.
 */
@SpringBootTest(webEnvironment = WebEnvironment.NONE, properties = {
	// Pin the placeholders so a developer's exported POSTGRES_* / MAILPIT_* variables
	// (or an .env loaded by Nx) cannot change what these tests assert.
	"POSTGRES_PORT=5432", "POSTGRES_DB=ccards", "POSTGRES_USER=ccards",
	"POSTGRES_PASSWORD=ccards", "MAILPIT_SMTP_PORT=1025",
	// Wiring test only: no database is running, so neither migrate nor validate,
	// and do not let Hibernate open a connection to detect the dialect.
	"spring.flyway.enabled=false", "spring.jpa.hibernate.ddl-auto=none",
	"spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect",
	"spring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access=false"
})
@ActiveProfiles("local")
class LocalProfileTests {

	@Autowired
	private Environment env;

	@Autowired(required = false)
	private DataSource dataSource;

	@Test
	void datasourceTargetsComposePostgres() {
		assertThat(dataSource).isNotNull();
		assertThat(env.getProperty("spring.datasource.url"))
			.isEqualTo("jdbc:postgresql://localhost:5432/ccards");
		assertThat(env.getProperty("spring.datasource.username")).isEqualTo("ccards");
	}

	@Test
	void mailTargetsMailpit() {
		assertThat(env.getProperty("spring.mail.host")).isEqualTo("localhost");
		assertThat(env.getProperty("spring.mail.port", Integer.class)).isEqualTo(1025);
	}

}
