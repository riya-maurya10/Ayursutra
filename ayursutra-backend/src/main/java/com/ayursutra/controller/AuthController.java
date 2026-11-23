package com.ayursutra.controller;

import com.ayursutra.constant.AuditAction;
import com.ayursutra.dto.request.ForgotPasswordRequest;
import com.ayursutra.dto.request.LoginRequest;
import com.ayursutra.dto.request.RegisterUserRequest;
import com.ayursutra.dto.request.ResetPasswordRequest;
import com.ayursutra.dto.request.VerifyOtpRequest;
import com.ayursutra.dto.response.LoginResponse;
import com.ayursutra.dto.response.UserResponse;
import com.ayursutra.service.AuditService;
import com.ayursutra.service.AuthenticationService;
import com.ayursutra.service.UserService;
import com.ayursutra.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;
    private final UserService userService;
    private final AuditService auditService;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(
            @RequestBody LoginRequest request) {

        LoginResponse response =
                authenticationService.login(request);

        auditService.log(
                AuditAction.LOGIN,
                "User",
                null,
                request.getEmail(),
                "User " + request.getEmail() + " logged in"
        );

        return ApiResponse.success(
                "Login Successful",
                response
        );
    }

    @PostMapping("/register")
    public ApiResponse<UserResponse> register(
            @Valid @RequestBody RegisterUserRequest request) {

        UserResponse response =
                userService.register(request);

        auditService.log(
                AuditAction.CREATE,
                "User",
                response.getId(),
                response.getFullName(),
                "User " + response.getFullName() + " registered"
        );

        return ApiResponse.success(
                "Registration Successful",
                response
        );
    }

    @PostMapping("/forgot-password")
    public ApiResponse<String> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        String message = authenticationService.forgotPassword(request);

        auditService.log(
                AuditAction.UPDATE,
                "User",
                null,
                request.getEmail(),
                "Password reset requested for " + request.getEmail()
        );

        return ApiResponse.success(
                message,
                null
        );
    }

    @PostMapping("/verify-otp")
    public ApiResponse<String> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {

        authenticationService.verifyOtp(request);

        return ApiResponse.success(
                "Verification code confirmed. Please set your new password.",
                "OTP verified successfully"
        );
    }

    @PostMapping("/reset-password")
    public ApiResponse<String> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        authenticationService.resetPassword(request);

        auditService.log(
                AuditAction.UPDATE,
                "User",
                null,
                request.getEmail() != null ? request.getEmail() : "Unknown",
                "Password reset completed successfully"
        );

        return ApiResponse.success(
                "Password has been reset successfully. You can now login with your new password.",
                "Password reset successful"
        );
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<String> logout() {

        auditService.log(
                AuditAction.LOGOUT,
                "User",
                null,
                null,
                "User logged out"
        );

        return ApiResponse.success(
                "Logout Successful",
                "User logged out successfully"
        );
    }

    @PutMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<String> changePassword(
            @Valid @RequestBody com.ayursutra.dto.request.ChangePasswordRequest request,
            org.springframework.security.core.Authentication authentication
    ) {
        authenticationService.changePassword(request, authentication.getName());

        auditService.log(
                AuditAction.UPDATE,
                "User",
                null,
                authentication.getName(),
                "User " + authentication.getName() + " changed password"
        );

        return ApiResponse.success(
                "Password updated successfully",
                "Password updated successfully"
        );
    }
}