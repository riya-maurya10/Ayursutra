package com.ayursutra.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescribedMedicineItem {
    private String medicineName;
    private String formulation; // e.g., Kashayam, Churna, Vati, Asava, Taila, Ghrita
    private String dosage; // e.g., "15 ml with warm water", "1 tablet"
    private String timing; // e.g., "Before food", "After food", "At bedtime"
    private Integer durationDays; // e.g., 14
    private String instructions; // e.g., "Take twice daily with warm honey-water"
}
