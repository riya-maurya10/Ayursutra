package com.ayursutra.service;

import com.ayursutra.dto.request.DoshaAssessmentRequest;
import com.ayursutra.dto.response.DoshaAssessmentResponse;

public interface DoshaAssessmentService {

    DoshaAssessmentResponse assessDosha(DoshaAssessmentRequest request);

}
