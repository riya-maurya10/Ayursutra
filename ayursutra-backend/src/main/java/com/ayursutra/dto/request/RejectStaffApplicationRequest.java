package com.ayursutra.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RejectStaffApplicationRequest {

    @NotBlank(message = "Rejection reason is required")
    private String reason;

}
