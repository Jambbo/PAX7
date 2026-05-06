package com.example.system.rest;

import com.example.system.domain.model.exception.ResourceAlreadyExistsException;
import com.example.system.domain.model.exception.ResourceNotFoundException;
import com.example.system.rest.controller.advice.GlobalExceptionHandler;
import com.example.system.rest.dto.exception.MessageDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

public class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("Test ResourceNotFoundException returns 404 message")
    public void givenResourceNotFoundException_whenHandle_thenReturnNotFoundMessage() {
        // Given
        ResourceNotFoundException ex = new ResourceNotFoundException("User not found");

        // When
        MessageDto result = handler.handleResourceNotFoundException(ex);

        // Then
        assertEquals("User not found", result.getMessage());
    }

    @Test
    @DisplayName("Test ResourceAlreadyExistsException returns conflict message")
    public void givenResourceAlreadyExistsException_whenHandle_thenReturnConflictMessage() {
        // Given
        ResourceAlreadyExistsException ex = new ResourceAlreadyExistsException("User already exists");

        // When
        MessageDto result = handler.handleResourceAlreadyExistsException(ex);

        // Then
        assertEquals("User already exists", result.getMessage());
    }

    @Test
    @DisplayName("Test MethodArgumentNotValidException returns validation error map")
    public void givenMethodArgumentNotValidException_whenHandle_thenReturnValidationErrors() {
        // Given
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("user", "email", "must not be blank");

        given(ex.getBindingResult()).willReturn(bindingResult);
        given(bindingResult.getFieldErrors()).willReturn(List.of(fieldError));

        // When
        MessageDto result = handler.handleValidationExceptions(ex);

        // Then
        assertEquals("Validation Failed", result.getMessage());
        assertEquals("must not be blank", result.getErrors().get("email"));
    }

    @Test
    @DisplayName("Test IllegalStateException returns bad request message")
    public void givenIllegalStateException_whenHandle_thenReturnBadRequestMessage() {
        // Given
        IllegalStateException ex = new IllegalStateException("Invalid state");

        // When
        MessageDto result = handler.handleIllegalStateException(ex);

        // Then
        assertEquals("Invalid state", result.getMessage());
    }

    @Test
    @DisplayName("Test IllegalArgumentException returns bad request message")
    public void givenIllegalArgumentException_whenHandle_thenReturnBadRequestMessage() {
        // Given
        IllegalArgumentException ex = new IllegalArgumentException("Bad argument");

        // When
        MessageDto result = handler.handleIllegalArgumentException(ex);

        // Then
        assertEquals("Bad argument", result.getMessage());
    }

    @Test
    @DisplayName("Test generic Exception returns internal server error message")
    public void givenGenericException_whenHandle_thenReturnInternalErrorMessage() {
        // Given
        Exception ex = new Exception("something broke");

        // When
        MessageDto result = handler.handleGeneralException(ex);

        // Then
        assertTrue(result.getMessage().contains("something broke"));
    }
}
