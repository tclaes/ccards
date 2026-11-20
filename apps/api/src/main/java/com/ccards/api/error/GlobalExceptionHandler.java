package com.ccards.api.error;

import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import org.springframework.validation.method.ParameterErrors;
import org.springframework.validation.method.ParameterValidationResult;

/**
 * Turns every failure into an RFC 9457 {@code application/problem+json}
 * response. Spring MVC's standard exceptions (404, 405, 415, ...) are mapped by
 * the base class; this class adds the {@code errors} list for validation
 * failures and a generic, logged 500 so internals never reach the client.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	/** One violated field, serialised as {@code {"field": ..., "message": ...}}. */
	public record FieldViolation(String field, String message) {
	}

	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		List<FieldViolation> errors = new ArrayList<>();
		ex.getBindingResult().getFieldErrors().forEach(e -> errors.add(violation(e)));
		ex.getBindingResult().getGlobalErrors().forEach(e -> errors.add(violation(e)));
		return validationProblem(ex, errors, headers, request);
	}

	@Override
	protected ResponseEntity<Object> handleHandlerMethodValidationException(HandlerMethodValidationException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		List<FieldViolation> errors = new ArrayList<>();
		for (ParameterValidationResult result : ex.getParameterValidationResults()) {
			if (result instanceof ParameterErrors parameterErrors) {
				parameterErrors.getFieldErrors().forEach(e -> errors.add(violation(e)));
				parameterErrors.getGlobalErrors().forEach(e -> errors.add(violation(e)));
			}
			else {
				String name = result.getMethodParameter().getParameterName();
				for (MessageSourceResolvable error : result.getResolvableErrors()) {
					errors.add(new FieldViolation(name != null ? name : "parameter", error.getDefaultMessage()));
				}
			}
		}
		return validationProblem(ex, errors, headers, request);
	}

	@Override
	protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		// Never echo ex.getMessage(): it contains parser internals.
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Malformed request body.");
		return handleExceptionInternal(ex, problem, headers, HttpStatus.BAD_REQUEST, request);
	}

	@ExceptionHandler(ConstraintViolationException.class)
	protected ResponseEntity<Object> handleConstraintViolation(ConstraintViolationException ex, WebRequest request) {
		List<FieldViolation> errors = ex.getConstraintViolations().stream()
			.map(v -> new FieldViolation(leafName(v.getPropertyPath()), v.getMessage()))
			.toList();
		return validationProblem(ex, errors, new HttpHeaders(), request);
	}

	@ExceptionHandler(Exception.class)
	protected ResponseEntity<Object> handleUnexpected(Exception ex, WebRequest request) {
		String path = request instanceof ServletWebRequest servletRequest
				? servletRequest.getRequest().getRequestURI() : "unknown";
		log.error("Unhandled exception for request {}", path, ex);
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
				"An unexpected error occurred.");
		return handleExceptionInternal(ex, problem, new HttpHeaders(), HttpStatus.INTERNAL_SERVER_ERROR, request);
	}

	@Override
	protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers,
			HttpStatusCode statusCode, WebRequest request) {
		ResponseEntity<Object> response = super.handleExceptionInternal(ex, body, headers, statusCode, request);
		// RFC 9457 `instance`: the request path, for every problem we return.
		if (response != null && response.getBody() instanceof ProblemDetail problem && problem.getInstance() == null
				&& request instanceof ServletWebRequest servletRequest) {
			problem.setInstance(URI.create(servletRequest.getRequest().getRequestURI()));
		}
		return response;
	}

	private ResponseEntity<Object> validationProblem(Exception ex, List<FieldViolation> errors, HttpHeaders headers,
			WebRequest request) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Request validation failed.");
		problem.setProperty("errors", errors);
		return handleExceptionInternal(ex, problem, headers, HttpStatus.BAD_REQUEST, request);
	}

	private static FieldViolation violation(FieldError error) {
		return new FieldViolation(error.getField(), error.getDefaultMessage());
	}

	private static FieldViolation violation(ObjectError error) {
		return new FieldViolation(error.getObjectName(), error.getDefaultMessage());
	}

	private static String leafName(Path path) {
		String name = null;
		for (Path.Node node : path) {
			name = node.getName();
		}
		return name != null ? name : path.toString();
	}

}
