package com.example.system.rest.controller.advice;

import com.example.system.domain.model.exception.ResourceAlreadyExistsException;
import com.example.system.domain.model.exception.ResourceNotFoundException;
import com.example.system.rest.dto.exception.MessageDto;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ExceptionHandler(ResourceNotFoundException.class)
    public MessageDto handleResourceNotFoundException(ResourceNotFoundException ex) {
        return new MessageDto(ex.getMessage());
    }

    @ResponseStatus(HttpStatus.CONFLICT)
    @ExceptionHandler(ResourceAlreadyExistsException.class)
    public MessageDto handleResourceAlreadyExistsException(ResourceAlreadyExistsException ex) {
        return new MessageDto(ex.getMessage());
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public MessageDto handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }
        return new MessageDto("Validation Failed", errors);
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(IllegalStateException.class)
    public MessageDto handleIllegalStateException(IllegalStateException ex) {
        return new MessageDto(ex.getMessage());
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(IllegalArgumentException.class)
    public MessageDto handleIllegalArgumentException(IllegalArgumentException ex) {
        return new MessageDto(ex.getMessage());
    }

    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ExceptionHandler(Exception.class)
    public MessageDto handleGeneralException(Exception ex) {
        return new MessageDto("An unexpected error occurred: " + ex.getMessage());
    }
}

