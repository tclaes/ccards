package com.ccards.api.error;

import com.ccards.api.service.CardNotFoundException;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;
import com.ccards.api.service.BarcodeNotRenderableException;
import com.ccards.api.service.CardNotFoundException;
import com.ccards.api.service.InvalidPatchException;
import com.ccards.api.service.UnsupportedFormatException;
import com.ccards.api.service.UnsupportedSortException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.validation.Errors;
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
		return validationProblem(ex, violations(ex.getBindingResult()), headers, request);
	}

	@Override
	protected ResponseEntity<Object> handleHandlerMethodValidationException(HandlerMethodValidationException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		List<FieldViolation> errors = new ArrayList<>();
		for (ParameterValidationResult result : ex.getParameterValidationResults()) {
			if (result instanceof ParameterErrors parameterErrors) {
				errors.addAll(violations(parameterErrors));
				continue;
			}
			String name = result.getMethodParameter().getParameterName();
			for (MessageSourceResolvable error : result.getResolvableErrors()) {
				errors.add(new FieldViolation(name != null ? name : "parameter", error.getDefaultMessage()));
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

	@ExceptionHandler(InvalidPatchException.class)
	protected ResponseEntity<Object> handleInvalidPatch(InvalidPatchException ex, WebRequest request) {
		List<FieldViolation> errors = ex.getViolations()
			.entrySet()
			.stream()
			.map(e -> new FieldViolation(e.getKey(), e.getValue()))
			.toList();
		return validationProblem(ex, errors, new HttpHeaders(), request);
	}

	@ExceptionHandler(CardNotFoundException.class)
	protected ResponseEntity<Object> handleCardNotFound(CardNotFoundException ex, WebRequest request) {
		// Never echo ex.getMessage(): keep the response generic.
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, "Card not found.");
		return handleExceptionInternal(ex, problem, new HttpHeaders(), HttpStatus.NOT_FOUND, request);
	}

	@ExceptionHandler(UnsupportedFormatException.class)
	protected ResponseEntity<Object> handleUnsupportedFormat(UnsupportedFormatException ex, WebRequest request) {
		return validationProblem(ex, List.of(new FieldViolation("format", "must be one of: png, svg")),
				new HttpHeaders(), request);
	}

	@ExceptionHandler(UnsupportedSortException.class)
	protected ResponseEntity<Object> handleUnsupportedSort(UnsupportedSortException ex, WebRequest request) {
		return validationProblem(ex, List.of(new FieldViolation("sort", "must be one of: name, lastUsed, mostUsed")),
				new HttpHeaders(), request);
	}

	@ExceptionHandler(BarcodeNotRenderableException.class)
	protected ResponseEntity<Object> handleBarcodeNotRenderable(BarcodeNotRenderableException ex,
			WebRequest request) {
		// Never echo the card number or ex.getMessage(); the log has the card id.
		log.warn("{}", ex.getMessage(), ex.getCause());
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY,
				"The card number cannot be drawn as its barcode type.");
		return handleExceptionInternal(ex, problem, new HttpHeaders(), HttpStatus.UNPROCESSABLE_ENTITY, request);
	}

	@ExceptionHandler(ObjectOptimisticLockingFailureException.class)
	protected ResponseEntity<Object> handleOptimisticLocking(ObjectOptimisticLockingFailureException ex,
			WebRequest request) {
		// Generic on purpose: the exception names the entity and its id.
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
				"The resource was changed by someone else. Reload it and try again.");
		return handleExceptionInternal(ex, problem, new HttpHeaders(), HttpStatus.CONFLICT, request);
	}

	@ExceptionHandler(Exception.class)
	protected ResponseEntity<Object> handleUnexpected(Exception ex, WebRequest request) {
		log.error("Unhandled exception for request {}", request.getDescription(false), ex);
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

	/** Field errors first, then object-level errors (reported under the object's name). */
	private static List<FieldViolation> violations(Errors errors) {
		return Stream.concat(
				errors.getFieldErrors().stream()
					.map(e -> new FieldViolation(e.getField(), e.getDefaultMessage())),
				errors.getGlobalErrors().stream()
					.map(e -> new FieldViolation(e.getObjectName(), e.getDefaultMessage())))
			.toList();
	}

	private static String leafName(Path path) {
		String name = null;
		for (Path.Node node : path) {
			name = node.getName();
		}
		return name != null ? name : path.toString();
	}

}
