package com.ccards.errortest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Test-only endpoints that exercise the global error handling before real
 * endpoints exist. Lives outside {@code com.ccards.api} so component scanning
 * never picks it up; tests opt in with {@code @Import}.
 */
@RestController
@RequestMapping("/test-errors")
public class ErrorTestController {

	public record Payload(@NotBlank String title, @Min(1) int count) {
	}

	@PostMapping("/body")
	public void body(@Valid @RequestBody Payload payload) {
	}

	@GetMapping("/param")
	public void param(@RequestParam @Min(1) int limit) {
	}

	@GetMapping("/boom")
	public void boom() {
		throw new IllegalStateException("secret internals");
	}

}
