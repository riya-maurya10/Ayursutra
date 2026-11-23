package com.ayursutra.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoshaAssessmentResponse {

    private String primaryDosha;

    private String secondaryDosha;

    private int vataPercentage;

    private int pittaPercentage;

    private int kaphaPercentage;

    private String characteristics;

    private List<String> recommendedTherapies;

    private List<String> dietaryGuidelines;

    private List<String> lifestyleRecommendations;

}
