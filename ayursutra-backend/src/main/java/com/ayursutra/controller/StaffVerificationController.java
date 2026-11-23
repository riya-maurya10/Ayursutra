package com.ayursutra.controller;

import com.ayursutra.constant.Role;
import com.ayursutra.constant.VerificationStatus;
import com.ayursutra.dto.request.RejectStaffApplicationRequest;
import com.ayursutra.dto.response.StaffVerificationApplicationResponse;
import com.ayursutra.service.StaffVerificationService;
import com.ayursutra.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff-verification")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class StaffVerificationController {

    private final StaffVerificationService staffVerificationService;

    @GetMapping("/pending")
    public ApiResponse<List<StaffVerificationApplicationResponse>> getPendingApplications(
            @RequestParam(required = false) String clinicId,
            @RequestParam(required = false) Role role
    ) {
        List<StaffVerificationApplicationResponse> list = staffVerificationService.getPendingApplications(clinicId, role);
        return ApiResponse.success("Pending staff applications fetched successfully", list);
    }

    @GetMapping("/all")
    public ApiResponse<List<StaffVerificationApplicationResponse>> getAllApplications(
            @RequestParam(required = false) String clinicId,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) VerificationStatus status
    ) {
        List<StaffVerificationApplicationResponse> list = staffVerificationService.getAllApplications(clinicId, role, status);
        return ApiResponse.success("Staff applications fetched successfully", list);
    }

    @GetMapping("/{userId}")
    public ApiResponse<StaffVerificationApplicationResponse> getApplicationDetails(
            @PathVariable String userId
    ) {
        StaffVerificationApplicationResponse details = staffVerificationService.getApplicationDetails(userId);
        return ApiResponse.success("Application details fetched successfully", details);
    }

    @PostMapping("/{userId}/approve")
    public ApiResponse<StaffVerificationApplicationResponse> approveApplication(
            @PathVariable String userId,
            Authentication authentication
    ) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@ayursutra.com";
        StaffVerificationApplicationResponse response = staffVerificationService.approveApplication(userId, adminEmail);
        return ApiResponse.success("Staff application approved and account activated", response);
    }

    @PostMapping("/{userId}/reject")
    public ApiResponse<StaffVerificationApplicationResponse> rejectApplication(
            @PathVariable String userId,
            @Valid @RequestBody RejectStaffApplicationRequest request,
            Authentication authentication
    ) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@ayursutra.com";
        StaffVerificationApplicationResponse response = staffVerificationService.rejectApplication(
                userId,
                request.getReason(),
                adminEmail
        );
        return ApiResponse.success("Staff application rejected", response);
    }

    @PostMapping("/{userId}/suspend")
    public ApiResponse<StaffVerificationApplicationResponse> suspendStaff(
            @PathVariable String userId,
            Authentication authentication
    ) {
        String adminEmail = authentication != null ? authentication.getName() : "admin@ayursutra.com";
        StaffVerificationApplicationResponse response = staffVerificationService.suspendStaff(userId, adminEmail);
        return ApiResponse.success("Staff member suspended", response);
    }
}
