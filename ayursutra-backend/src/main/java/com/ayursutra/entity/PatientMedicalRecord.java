package com.ayursutra.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "patient_medical_records")
public class PatientMedicalRecord {

    @Id
    private String id;

    private String patientId;

    private String clinicId;

    // Vitals baseline
    private String bloodGroup;
    private Double heightCm;
    private Double weightKg;
    private String bloodPressure;
    private Integer pulseRate;

    // Medical history
    @Builder.Default
    private List<String> chronicConditions = new ArrayList<>();

    @Builder.Default
    private List<String> allergies = new ArrayList<>();

    @Builder.Default
    private List<MedicationItem> currentMedications = new ArrayList<>();

    @Builder.Default
    private List<SurgeryItem> pastSurgeries = new ArrayList<>();

    @Builder.Default
    private List<String> familyMedicalHistory = new ArrayList<>();

    @Builder.Default
    private List<String> lifestyleHabits = new ArrayList<>();

    private String dietaryHabits;
    private String previousTreatments;
    private String clinicalObservations;

    // Ayurvedic Profile
    private String prakritiDominant;
    private Integer vataPercentage;
    private Integer pittaPercentage;
    private Integer kaphaPercentage;
    private String vikritiImbalance;
    private String agniType; // e.g. "Vishama Agni", "Manda Agni", "Tikshna Agni", "Sama Agni"
    private String amaStatus; // e.g. "Nirama", "Sama"
    private String koshtha; // e.g. "Krura", "Mrudu", "Madhyama"

    @Builder.Default
    private List<String> dhatuImbalances = new ArrayList<>();

    private String malaObservations;
    private String sleepQuality;
    private String appetiteDigestion;

    // Audit trail
    @Builder.Default
    private List<MedicalRecordAuditItem> auditHistory = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
