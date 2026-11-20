package com.ccards.api;

import static org.assertj.core.api.Assertions.assertThat;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;

/** The default profile must start without any database or mail server. */
@WithoutDatabase
@SpringBootTest(webEnvironment = WebEnvironment.NONE)
class DefaultProfileTests {

	@Autowired(required = false)
	private DataSource dataSource;

	@Test
	void noDatasourceWithoutLocalProfile() {
		assertThat(dataSource).isNull();
	}

}
