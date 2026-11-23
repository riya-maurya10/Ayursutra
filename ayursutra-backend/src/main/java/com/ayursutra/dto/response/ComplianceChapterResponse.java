package com.ayursutra.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceChapterResponse {

    private String code;

    private String name;

    private String description;

    private Integer displayOrder;

    private long totalItems;

    private long compliantItems;

    private long partialItems;

    private long notStartedItems;

    private long notApplicableItems;

    private double readinessPercentage;
}