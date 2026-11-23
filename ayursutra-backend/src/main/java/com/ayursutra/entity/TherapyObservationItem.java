package com.ayursutra.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TherapyObservationItem {
    private String id;
    private String therapistId;
    private String therapistUserId;
    private String therapistName;
    private String therapySessionId;
    private String therapyName;
    private String observation;
    private String patientFeedback;
    private Integer vitalPulse;
    private String vitalBloodPressure;
    private LocalDateTime recordedAt;
}
