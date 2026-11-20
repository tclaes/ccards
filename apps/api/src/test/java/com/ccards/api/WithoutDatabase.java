package com.ccards.api;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.ccards.api.repository.LoyaltyCardRepository;

/**
 * For full-context tests on the default profile: it has no DataSource, so Spring
 * Data creates no repositories, but the card service needs one. Replaces it with
 * a mock.
 */
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@MockitoBean(types = LoyaltyCardRepository.class)
public @interface WithoutDatabase {

}
