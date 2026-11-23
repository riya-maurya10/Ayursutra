package com.ayursutra.controller;

import com.ayursutra.constant.AuditAction;
import com.ayursutra.dto.request.ClinicSettingsRequest;
import com.ayursutra.dto.request.UserSettingsRequest;
import com.ayursutra.dto.response.ClinicSettingsResponse;
import com.ayursutra.dto.response.UserSettingsResponse;
import com.ayursutra.security.UserPrincipal;
import com.ayursutra.service.AuditService;
import com.ayursutra.service.SettingsService;
import com.ayursutra.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;
    private final AuditService auditService;

    @GetMapping("/clinic")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ClinicSettingsResponse> getClinicSettings(
            @RequestParam(required = false, defaultValue = "CLINIC-MAIN") String clinicId
    ) {
        return new ApiResponse<>(
                true,
                "Clinic settings fetched successfully",
                settingsService.getClinicSettings(clinicId)
        );
    }

    @PutMapping("/clinic")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ClinicSettingsResponse> updateClinicSettings(
            @RequestParam(required = false, defaultValue = "CLINIC-MAIN") String clinicId,
            @RequestBody ClinicSettingsRequest request,
            Authentication authentication
    ) {
        ClinicSettingsResponse response = settingsService.updateClinicSettings(clinicId, request);

        auditService.log(
                AuditAction.UPDATE,
                "ClinicSettings",
                response.getId(),
                authentication.getName(),
                "Clinic settings updated by admin " + authentication.getName()
        );

        return new ApiResponse<>(
                true,
                "Clinic settings updated successfully",
                response
        );
    }

    @GetMapping("/user")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<UserSettingsResponse> getUserSettings(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return new ApiResponse<>(
                true,
                "User settings fetched successfully",
                settingsService.getUserSettings(principal.getUser().getId())
        );
    }

    @PutMapping("/user")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<UserSettingsResponse> updateUserSettings(
            @RequestBody UserSettingsRequest request,
            Authentication authentication
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        UserSettingsResponse response = settingsService.updateUserSettings(principal.getUser().getId(), request);

        auditService.log(
                AuditAction.UPDATE,
                "UserSettings",
                response.getId(),
                authentication.getName(),
                "User settings updated for user " + authentication.getName()
        );

        return new ApiResponse<>(
                true,
                "User settings updated successfully",
                response
        );
    }
}
