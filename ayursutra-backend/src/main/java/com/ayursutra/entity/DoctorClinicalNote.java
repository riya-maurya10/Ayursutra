package com.ayursutra.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "clinical_notes")
public class DoctorClinicalNote {

    @Id
    private String id;

    private String patientId;
    private String clinicId;
    private String appointmentId;

    // Doctor details
    private String doctorId;
    private String doctorUserId;
    private String doctorName;
    private String doctorSpecialization;

    // Timing & Visit
    private LocalDate consultationDate;
    private LocalTime consultationTime;
    private String visitType; // e.g. "INITIAL_CONSULTATION", "FOLLOW_UP", "ROUTINE_CHECKUP"

    // Clinical Presentation
    private String chiefComplaints;

    @Builder.Default
    private List<String> symptoms = new ArrayList<>();

    private String clinicalObservations;
    private String diagnosis;

    // Ayurvedic Examination Findings (Ashtavidha / Dashavidha Pariksha)
    private String prakritiObservation;
    private String vikritiObservation;
    private String nadiPariksha; // Pulse diagnosis
    private String jihvaPariksha; // Tongue diagnosis
    private String netraPariksha; // Eye diagnosis
    private String agniObservation;
    private String amaObservation;

    // Treatment & Prescriptions
    private String treatmentRecommendations;

    @Builder.Default
    private List<PrescribedMedicineItem> prescribedMedicines = new ArrayList<>();

    @Builder.Default
    private List<String> recommendedTherapies = new ArrayList<>();

    private String dietaryAdvice;
    private String lifestyleInstructions;

    // Follow-up
    private LocalDate followUpDate;
    private String followUpInstructions;

    @Builder.Default
    private Boolean isConfidential = false;

    // Therapist observations attached to this consultation / treatment
    @Builder.Default
    private List<TherapyObservationItem> therapistNotes = new ArrayList<>();

    // Audit trail
    @Builder.Default
    private List<MedicalRecordAuditItem> auditHistory = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
