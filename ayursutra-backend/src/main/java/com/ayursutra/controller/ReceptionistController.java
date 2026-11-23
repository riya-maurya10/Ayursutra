package com.ayursutra.controller;

import com.ayursutra.constant.AuditAction;
import com.ayursutra.dto.request.AuditLogRequest;
import com.ayursutra.dto.request.UpdateReceptionistProfileRequest;
import com.ayursutra.dto.response.ReceptionistResponse;
import com.ayursutra.service.AuditService;
import com.ayursutra.service.ReceptionistService;
import com.ayursutra.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/receptionists")
@RequiredArgsConstructor
public class ReceptionistController {

    private final ReceptionistService receptionistService;
    private final AuditService auditService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('RECEPTIONIST')")
    public ApiResponse<ReceptionistResponse> getMyProfile() {
        return new ApiResponse<>(
                true,
                "Receptionist profile fetched successfully",
                receptionistService.getMyProfile()
        );
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('RECEPTIONIST')")
    public ApiResponse<ReceptionistResponse> updateMyProfile(
            @Valid @RequestBody UpdateReceptionistProfileRequest request) {

        ReceptionistResponse res = receptionistService.updateMyProfile(request);

        AuditLogRequest audit = new AuditLogRequest();
        audit.setAction(AuditAction.UPDATE);
        audit.setEntityType("RECEPTIONIST");
        audit.setEntityId(res.getId());
        audit.setDescription("Receptionist self-updated profile");
        auditService.createAuditLog(audit);

        return new ApiResponse<>(
                true,
                "Receptionist profile updated successfully",
                res
        );
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ApiResponse<List<ReceptionistResponse>> getAllReceptionists() {
        return new ApiResponse<>(
                true,
                "Receptionists fetched successfully",
                receptionistService.getAllReceptionists()
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ApiResponse<ReceptionistResponse> getReceptionistById(@PathVariable String id) {
        return new ApiResponse<>(
                true,
                "Receptionist fetched successfully",
                receptionistService.getReceptionistById(id)
        );
    }
}
