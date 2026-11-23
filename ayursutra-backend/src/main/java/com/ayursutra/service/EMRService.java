package com.ayursutra.service;

import com.ayursutra.dto.request.AddTherapyObservationRequest;
import com.ayursutra.dto.request.CreateClinicalNoteRequest;
import com.ayursutra.dto.request.DoshaAssessmentRequest;
import com.ayursutra.dto.request.UpdateClinicalNoteRequest;
import com.ayursutra.dto.request.UpsertMedicalRecordRequest;
import com.ayursutra.dto.response.DoshaAssessmentResponse;
import com.ayursutra.dto.response.PatientEMRSummaryResponse;
import com.ayursutra.entity.DoctorClinicalNote;
import com.ayursutra.entity.PatientMedicalRecord;

import java.util.List;

public interface EMRService {

    PatientEMRSummaryResponse getPatientEMR(String patientId);

    PatientEMRSummaryResponse getMyEMR();

    PatientMedicalRecord upsertMedicalRecord(String patientId, UpsertMedicalRecordRequest request);

    DoctorClinicalNote createClinicalNote(CreateClinicalNoteRequest request);

    DoctorClinicalNote updateClinicalNote(String noteId, UpdateClinicalNoteRequest request);

    DoctorClinicalNote addTherapyObservation(String noteId, AddTherapyObservationRequest request);

    DoshaAssessmentResponse calculateAndAttachDosha(String patientId, DoshaAssessmentRequest request);

    List<PatientMedicalRecord> searchMedicalRecords(String query);
}
