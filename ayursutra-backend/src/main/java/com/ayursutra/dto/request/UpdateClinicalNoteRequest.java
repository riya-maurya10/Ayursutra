package com.ayursutra.dto.request;

import com.ayursutra.entity.PrescribedMedicineItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateClinicalNoteRequest {

    private String chiefComplaints;
    private List<String> symptoms;
    private String clinicalObservations;
    private String diagnosis;

    // Ayurvedic Examination Findings
    private String prakritiObservation;
    private String vikritiObservation;
    private String nadiPariksha;
    private String jihvaPariksha;
    private String netraPariksha;
    private String agniObservation;
    private String amaObservation;

    // Treatment & Prescriptions
    private String treatmentRecommendations;
    private List<PrescribedMedicineItem> prescribedMedicines;
    private List<String> recommendedTherapies;
    private String dietaryAdvice;
    private String lifestyleInstructions;

    // Follow-up
    private LocalDate followUpDate;
    private String followUpInstructions;
    private Boolean isConfidential;
    private String editReason;
}
