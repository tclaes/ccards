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
@SpringBootTest(webEnvironment = WebEnvironment.NONE)
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
