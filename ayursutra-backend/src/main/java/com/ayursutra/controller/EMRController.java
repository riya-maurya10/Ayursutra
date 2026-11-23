package com.ayursutra.controller;

import com.ayursutra.dto.request.AddTherapyObservationRequest;
import com.ayursutra.dto.request.CreateClinicalNoteRequest;
import com.ayursutra.dto.request.DoshaAssessmentRequest;
import com.ayursutra.dto.request.UpdateClinicalNoteRequest;
import com.ayursutra.dto.request.UpsertMedicalRecordRequest;
import com.ayursutra.dto.response.DoshaAssessmentResponse;
import com.ayursutra.dto.response.PatientEMRSummaryResponse;
import com.ayursutra.entity.DoctorClinicalNote;
import com.ayursutra.entity.PatientMedicalRecord;
import com.ayursutra.service.EMRService;
import com.ayursutra.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emr")
@RequiredArgsConstructor
public class EMRController {

    private final EMRService emrService;

    // =========================================================
    // 1. GET PATIENT EMR (LONGITUDINAL SUMMARY)
    // =========================================================
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','THERAPIST','RECEPTIONIST','PATIENT')")
    public ApiResponse<PatientEMRSummaryResponse> getPatientEMR(
            @PathVariable String patientId) {

        PatientEMRSummaryResponse summary = emrService.getPatientEMR(patientId);
        return ApiResponse.success("Patient medical record retrieved successfully", summary);
    }

    // =========================================================
    // 2. GET MY EMR (PATIENT SELF-SERVICE)
    // =========================================================
    @GetMapping("/my")
    @PreAuthorize("hasRole('PATIENT')")
    public ApiResponse<PatientEMRSummaryResponse> getMyEMR() {
        PatientEMRSummaryResponse summary = emrService.getMyEMR();
        return ApiResponse.success("Personal medical record retrieved successfully", summary);
    }

    // =========================================================
    // 3. UPSERT MEDICAL RECORD (VITALS & HISTORY)
    // =========================================================
    @PutMapping("/patient/{patientId}/medical-record")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ApiResponse<PatientMedicalRecord> upsertMedicalRecord(
            @PathVariable String patientId,
            @Valid @RequestBody UpsertMedicalRecordRequest request) {

        PatientMedicalRecord record = emrService.upsertMedicalRecord(patientId, request);
        return ApiResponse.success("Medical record and vitals updated successfully", record);
    }

    // =========================================================
    // 4. CREATE CLINICAL CONSULTATION NOTE
    // =========================================================
    @PostMapping("/clinical-notes")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ApiResponse<DoctorClinicalNote> createClinicalNote(
            @Valid @RequestBody CreateClinicalNoteRequest request) {

        DoctorClinicalNote note = emrService.createClinicalNote(request);
        return ApiResponse.success("Doctor clinical note created successfully", note);
    }

    // =========================================================
    // 5. UPDATE CLINICAL NOTE
    // =========================================================
    @PutMapping("/clinical-notes/{noteId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ApiResponse<DoctorClinicalNote> updateClinicalNote(
            @PathVariable String noteId,
            @Valid @RequestBody UpdateClinicalNoteRequest request) {

        DoctorClinicalNote note = emrService.updateClinicalNote(noteId, request);
        return ApiResponse.success("Clinical note updated successfully", note);
    }

    // =========================================================
    // 6. ADD THERAPY OBSERVATION
    // =========================================================
    @PostMapping("/clinical-notes/{noteId}/therapy-observation")
    @PreAuthorize("hasAnyRole('THERAPIST','ADMIN')")
    public ApiResponse<DoctorClinicalNote> addTherapyObservation(
            @PathVariable String noteId,
            @Valid @RequestBody AddTherapyObservationRequest request) {

        DoctorClinicalNote note = emrService.addTherapyObservation(noteId, request);
        return ApiResponse.success("Therapy observation recorded successfully", note);
    }

    // =========================================================
    // 7. ASSESS & ATTACH DOSHA (REUSING DOSHA ASSESSMENT MODULE)
    // =========================================================
    @PostMapping("/patient/{patientId}/assess-dosha")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ApiResponse<DoshaAssessmentResponse> assessDosha(
            @PathVariable String patientId,
            @Valid @RequestBody DoshaAssessmentRequest request) {

        DoshaAssessmentResponse response = emrService.calculateAndAttachDosha(patientId, request);
        return ApiResponse.success("Dosha & Prakriti assessment saved to medical record successfully", response);
    }

    // =========================================================
    // 8. SEARCH MEDICAL RECORDS
    // =========================================================
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','THERAPIST','RECEPTIONIST')")
    public ApiResponse<List<PatientMedicalRecord>> searchMedicalRecords(
            @RequestParam(required = false) String query) {

        List<PatientMedicalRecord> results = emrService.searchMedicalRecords(query);
        return ApiResponse.success("Medical records search completed", results);
    }
}
