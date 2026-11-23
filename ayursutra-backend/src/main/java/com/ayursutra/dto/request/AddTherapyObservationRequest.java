package com.ayursutra.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddTherapyObservationRequest {

    private String therapySessionId;
    private String therapyName;

    @NotBlank(message = "Observation is required")
    private String observation;

    private String patientFeedback;
    private Integer vitalPulse;
    private String vitalBloodPressure;
}
