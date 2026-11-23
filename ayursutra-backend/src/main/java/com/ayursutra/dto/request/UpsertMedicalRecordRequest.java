package com.ayursutra.dto.request;

import com.ayursutra.entity.MedicationItem;
import com.ayursutra.entity.SurgeryItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpsertMedicalRecordRequest {

    // Vitals baseline
    private String bloodGroup;
    private Double heightCm;
    private Double weightKg;
    private String bloodPressure;
    private Integer pulseRate;

    // Medical history
    private List<String> chronicConditions;
    private List<String> allergies;
    private List<MedicationItem> currentMedications;
    private List<SurgeryItem> pastSurgeries;
    private List<String> familyMedicalHistory;
    private List<String> lifestyleHabits;
    private String dietaryHabits;
    private String previousTreatments;
    private String clinicalObservations;

    // Ayurvedic Profile
    private String prakritiDominant;
    private Integer vataPercentage;
    private Integer pittaPercentage;
    private Integer kaphaPercentage;
    private String vikritiImbalance;
    private String agniType;
    private String amaStatus;
    private String koshtha;
    private List<String> dhatuImbalances;
    private String malaObservations;
    private String sleepQuality;
    private String appetiteDigestion;
}
