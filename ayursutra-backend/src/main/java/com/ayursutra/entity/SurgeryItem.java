package com.ayursutra.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SurgeryItem {
    private String procedureName;
    private Integer year;
    private String hospitalOrDoctor;
    private String notes;
}
