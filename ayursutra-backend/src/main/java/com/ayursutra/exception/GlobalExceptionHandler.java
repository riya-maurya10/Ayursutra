package com.ayursutra.exception;

import com.ayursutra.util.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // =========================================================
    // HANDLE DEACTIVATED USER ACCOUNT
    // =========================================================

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiResponse<Object>> handleDisabledAccount(
            DisabledException exception) {

        ApiResponse<Object> response = new ApiResponse<>(
                false,
                "Your account has been deactivated. Please contact the clinic administrator.",
                null
        );

        return new ResponseEntity<>(
                response,
                HttpStatus.FORBIDDEN
        );
    }

    // =========================================================
    // HANDLE VALIDATION / BUSINESS ERRORS
    // =========================================================

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadRequest(
            BadRequestException exception) {

        ApiResponse<Object> response = new ApiResponse<>(
                false,
                exception.getMessage(),
                null
        );

        return new ResponseEntity<>(
                response,
                HttpStatus.BAD_REQUEST
        );
    }

    // =========================================================
    // HANDLE ACCESS DENIED (SPRING SECURITY AUTHORIZATION)
    // =========================================================

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDenied(
            org.springframework.security.access.AccessDeniedException exception) {

        ApiResponse<Object> response = new ApiResponse<>(
                false,
                "Access Denied: You do not have permission to access this resource.",
                null
        );

        return new ResponseEntity<>(
                response,
                HttpStatus.FORBIDDEN
        );
    }

    // =========================================================
    // HANDLE RESPONSE STATUS EXCEPTION (E.G. 404 NOT FOUND)
    // =========================================================

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Object>> handleResponseStatusException(
            org.springframework.web.server.ResponseStatusException exception) {

        ApiResponse<Object> response = new ApiResponse<>(
                false,
                exception.getReason() != null ? exception.getReason() : exception.getMessage(),
                null
        );

        return new ResponseEntity<>(
                response,
                exception.getStatusCode()
        );
    }

    // =========================================================
    // HANDLE AUTHENTICATION FAILURE (BAD CREDENTIALS / BAD AUTH)
    // =========================================================

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<ApiResponse<Object>> handleAuthenticationException(
            org.springframework.security.core.AuthenticationException exception) {

        ApiResponse<Object> response = new ApiResponse<>(
                false,
                "Invalid email or password. Please verify your credentials.",
                null
        );

        return new ResponseEntity<>(
                response,
                HttpStatus.UNAUTHORIZED
        );
    }

    // =========================================================
    // HANDLE ALL OTHER UNEXPECTED ERRORS
    // =========================================================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleException(
            Exception exception) {

        ApiResponse<Object> response = new ApiResponse<>(
                false,
                exception.getMessage(),
                null
        );

        return new ResponseEntity<>(
                response,
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}