package com.ayursutra.dto.request;

import com.ayursutra.constant.ComplianceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ComplianceUpdateRequest {

    @NotNull
    private ComplianceStatus status;

    private String notes;
}