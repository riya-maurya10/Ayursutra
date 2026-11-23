package com.ayursutra.controller;

import com.ayursutra.dto.request.AuditLogRequest;
import com.ayursutra.dto.request.ComplianceUpdateRequest;
import com.ayursutra.dto.response.ComplianceChapterResponse;
import com.ayursutra.entity.ComplianceChecklistItem;
import com.ayursutra.constant.AuditAction;
import com.ayursutra.service.AuditService;
import com.ayursutra.service.ComplianceService;
import com.ayursutra.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/compliance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ComplianceController {

    private final ComplianceService complianceService;

    private final AuditService auditService;


    // =========================================
    // GET ALL CHAPTERS
    // =========================================

    @GetMapping("/chapters")
    public ApiResponse<List<ComplianceChapterResponse>>
    getChapterSummary() {

        return new ApiResponse<>(
                true,
                "Compliance chapters fetched successfully",
                complianceService.getChapterSummary()
        );
    }


    // =========================================
    // GET OVERALL READINESS
    // =========================================

    @GetMapping("/readiness")
    public ApiResponse<Map<String, Double>>
    getOverallReadiness() {

        return new ApiResponse<>(
                true,
                "Compliance readiness fetched successfully",
                Map.of(
                        "readiness",
                        complianceService
                                .getOverallReadiness()
                )
        );
    }


    // =========================================
    // GET CHECKLIST
    // =========================================

    @GetMapping("/chapters/{chapterCode}")
    public ApiResponse<List<ComplianceChecklistItem>>
    getChecklist(
            @PathVariable String chapterCode) {

        return new ApiResponse<>(
                true,
                "Compliance checklist fetched successfully",
                complianceService.getChecklist(
                        chapterCode.toUpperCase()
                )
        );
    }


    // =========================================
    // UPDATE CHECKLIST
    // =========================================

    @PutMapping("/items/{id}")
    public ApiResponse<ComplianceChecklistItem>
    updateChecklistItem(
            @PathVariable String id,
            @Valid @RequestBody
            ComplianceUpdateRequest request) {

        ComplianceChecklistItem updated =
                complianceService
                        .updateChecklistItem(
                                id,
                                request
                        );


        AuditLogRequest audit =
                new AuditLogRequest();

        audit.setAction(
                AuditAction.UPDATE
        );

        audit.setEntityType(
                "COMPLIANCE_CHECKLIST"
        );

        audit.setEntityId(
                updated.getId()
        );

        audit.setDescription(
                "Compliance checklist status updated to "
                        + updated.getStatus()
        );

        auditService.createAuditLog(audit);


        return new ApiResponse<>(
                true,
                "Compliance checklist updated successfully",
                updated
        );
    }
}