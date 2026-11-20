package com.ccards.api.contract;

import static org.assertj.core.api.Assertions.assertThat;

import com.ccards.api.generated.api.HealthApi;
import com.ccards.api.generated.model.Health;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

/**
 * Compile-time guard: the interfaces generated from libs/api-contract/openapi.yaml
 * can be implemented. If the contract renames or removes an operation this class
 * stops compiling, which is how a contract change surfaces in the backend.
 */
class GeneratedContractTests {

	private final HealthApi api = () -> ResponseEntity.ok(new Health().status("UP"));

	@Test
	void generatedInterfaceIsImplementable() {
		assertThat(api.getHealth().getBody()).isNotNull();
		assertThat(api.getHealth().getBody().getStatus()).isEqualTo("UP");
	}

}
