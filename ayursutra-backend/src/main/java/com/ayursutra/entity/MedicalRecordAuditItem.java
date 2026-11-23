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
public class MedicalRecordAuditItem {
    private String action; // e.g. "RECORD_CREATED", "RECORD_UPDATED", "NOTE_ADDED", "NOTE_EDITED", "OBSERVATION_ADDED"
    private String performedByUserId;
    private String performedByName;
    private String performedByRole;
    private String summary;
    private LocalDateTime timestamp;
}
