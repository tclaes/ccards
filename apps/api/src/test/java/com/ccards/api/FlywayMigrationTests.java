package com.ccards.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;

import javax.sql.DataSource;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.exception.FlywayValidateException;
import org.hibernate.tool.schema.spi.SchemaManagementException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import com.ccards.ghost.GhostScan;

/**
 * Runs the real migrations against a throwaway PostgreSQL. Skipped (not failed)
 * when Docker is unavailable, so {@code nx test api} stays Docker-optional.
 */
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("local") // the default profile has no datasource; @ServiceConnection swaps in the container URL
@SpringBootTest(webEnvironment = WebEnvironment.NONE)
class FlywayMigrationTests {

	@Container
	@ServiceConnection
	static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17");

	private final JdbcTemplate jdbc;

	private final Flyway flyway;

	@Autowired
	FlywayMigrationTests(DataSource dataSource, Flyway flyway) {
		this.jdbc = new JdbcTemplate(dataSource);
		this.flyway = flyway;
	}

	@Test
	void migrationsAreAppliedAtStartup() {
		List<Map<String, Object>> history = jdbc.queryForList(
			"select version, success from flyway_schema_history where version is not null order by installed_rank");

		assertThat(history).extracting(row -> row.get("version")).containsExactly("1", "2", "3", "4", "5");
		assertThat(history).allSatisfy(row -> assertThat(row).containsEntry("success", true));
	}

	@Test
	void restartAppliesNothingAgain() {
		assertThat(flyway.migrate().migrationsExecuted).isZero();
	}

	@Test
	void cardsFromBeforeTheFavoriteMarkAreNotFavorites() {
		String schema = "favorite_migration";
		String table = schema + ".loyalty_card";
		migrate(schema, "4");
		jdbc.update("""
				insert into %s (id, name, store, card_number, barcode_type, owner_id, created_at, updated_at)
				values (gen_random_uuid(), 'n', 's', '1', 'CODE_128', gen_random_uuid(), now(), now())
				""".formatted(table));

		migrate(schema, "latest");

		assertThat(jdbc.queryForList("select favorite from " + table, Boolean.class)).containsExactly(false);
	}

	/** Migrates a schema of its own, so the one the application uses is left alone. */
	private void migrate(String schema, String target) {
		Flyway.configure()
			.configuration(flyway.getConfiguration())
			.schemas(schema)
			.defaultSchema(schema)
			.target(target)
			.load()
			.migrate();
	}

	@Test
	void editedMigrationIsRejected() {
		Integer originalChecksum = jdbc.queryForObject(
			"select checksum from flyway_schema_history where version = '1'", Integer.class);
		// Simulates V1__init.sql having been edited after it was applied.
		jdbc.update("update flyway_schema_history set checksum = ? where version = '1'", originalChecksum + 1);
		try {
			assertThatThrownBy(flyway::validate)
				.isInstanceOf(FlywayValidateException.class)
				.hasMessageContaining("checksum mismatch")
				.hasMessageContaining("version 1");
		}
		finally {
			jdbc.update("update flyway_schema_history set checksum = ? where version = '1'", originalChecksum);
		}
	}

	@Test
	void entityWithoutMigratedTableFailsStartupAndLeavesSchemaUntouched() {
		assertThatThrownBy(() -> new SpringApplicationBuilder(ApiApplication.class, GhostScan.class)
			.web(WebApplicationType.NONE)
			.run(
				// Command-line arguments outrank application-local.yml.
				"--spring.profiles.active=local",
				"--spring.datasource.url=" + POSTGRES.getJdbcUrl(),
				"--spring.datasource.username=" + POSTGRES.getUsername(),
				"--spring.datasource.password=" + POSTGRES.getPassword()))
			.rootCause()
			.isInstanceOf(SchemaManagementException.class)
			.hasMessageContaining("ghost_entity");

		Integer ghostTables = jdbc.queryForObject(
			"select count(*) from information_schema.tables where table_name = 'ghost_entity'", Integer.class);
		assertThat(ghostTables).isZero();
	}

}
