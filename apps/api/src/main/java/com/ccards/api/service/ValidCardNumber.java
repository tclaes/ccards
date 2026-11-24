package com.ccards.api.service;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/** The card number must be valid for the card's barcode type. Needs two fields, so it sits on the class. */
@Documented
@Constraint(validatedBy = CardNumberValidator.class)
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidCardNumber {

	String message() default "is not a valid card number for the barcode type";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

}
