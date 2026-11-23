package com.ayursutra.controller;

import com.ayursutra.constant.InvitationStatus;
import com.ayursutra.constant.Role;
import com.ayursutra.dto.request.CreateStaffInvitationRequest;
import com.ayursutra.dto.request.StaffRegistrationRequest;
import com.ayursutra.dto.response.StaffInvitationResponse;
import com.ayursutra.service.StaffInvitationService;
import com.ayursutra.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff-invitations")
@RequiredArgsConstructor
public class StaffInvitationController {

    private final StaffInvitationService staffInvitationService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<StaffInvitationResponse> createInvitation(
            @Valid @RequestBody CreateStaffInvitationRequest request,
            Authentication authentication
    ) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@ayursutra.com";
        StaffInvitationResponse response = staffInvitationService.createInvitation(request, adminEmail);
        return ApiResponse.success("Staff invitation created successfully", response);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<StaffInvitationResponse>> getAllInvitations(
            @RequestParam(required = false) String clinicId,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) InvitationStatus status
    ) {
        List<StaffInvitationResponse> invitations = staffInvitationService.getAllInvitations(clinicId, role, status);
        return ApiResponse.success("Invitations fetched successfully", invitations);
    }

    @GetMapping("/token/{token}")
    public ApiResponse<StaffInvitationResponse> getInvitationByToken(
            @PathVariable String token
    ) {
        StaffInvitationResponse response = staffInvitationService.getInvitationByToken(token);
        return ApiResponse.success("Invitation validated", response);
    }

    @PostMapping("/register")
    public ApiResponse<String> registerStaff(
            @Valid @RequestBody StaffRegistrationRequest request
    ) {
        String message = staffInvitationService.registerStaff(request);
        return ApiResponse.success(message, message);
    }

    @PostMapping("/{id}/resend")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<StaffInvitationResponse> resendInvitation(
            @PathVariable String id,
            Authentication authentication
    ) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@ayursutra.com";
        StaffInvitationResponse response = staffInvitationService.resendInvitation(id, adminEmail);
        return ApiResponse.success("Invitation resent successfully", response);
    }

    @PostMapping("/{id}/revoke")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<StaffInvitationResponse> revokeInvitation(
            @PathVariable String id,
            Authentication authentication
    ) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@ayursutra.com";
        StaffInvitationResponse response = staffInvitationService.revokeInvitation(id, adminEmail);
        return ApiResponse.success("Invitation revoked successfully", response);
    }
}
