package com.ayursutra.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class DoshaAssessmentRequest {

    private String patientId;

    // question key -> "VATA", "PITTA", "KAPHA"
    private Map<String, String> answers;

}
