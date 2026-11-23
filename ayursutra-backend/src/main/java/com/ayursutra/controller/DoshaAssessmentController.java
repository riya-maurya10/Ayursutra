package com.ayursutra.controller;

import com.ayursutra.dto.request.DoshaAssessmentRequest;
import com.ayursutra.dto.response.DoshaAssessmentResponse;
import com.ayursutra.service.DoshaAssessmentService;
import com.ayursutra.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dosha-assessment")
@RequiredArgsConstructor
public class DoshaAssessmentController {

    private final DoshaAssessmentService doshaAssessmentService;

    @PostMapping("/calculate")
    public ApiResponse<DoshaAssessmentResponse> calculateDosha(
            @RequestBody DoshaAssessmentRequest request) {

        DoshaAssessmentResponse response = doshaAssessmentService.assessDosha(request);

        return ApiResponse.success(
                "Dosha & Prakriti assessment completed successfully",
                response
        );
    }
}
