package com.ayursutra.mapper;

import com.ayursutra.dto.request.CreatePatientRequest;
import com.ayursutra.dto.request.UpdatePatientRequest;
import com.ayursutra.dto.response.PatientResponse;
import com.ayursutra.entity.Patient;
import org.springframework.stereotype.Component;

@Component
public class PatientMapper {

    public Patient toEntity(CreatePatientRequest request) {

        Patient patient = new Patient();

        patient.setUserId(request.getUserId());
        patient.setFullName(request.getFullName());
        patient.setEmail(request.getEmail());
        patient.setPhone(request.getPhone());
        patient.setAge(request.getAge());
        patient.setGender(request.getGender());
        patient.setAddress(request.getAddress());
        patient.setMedicalHistory(request.getMedicalHistory());

        return patient;
    }

    public PatientResponse toResponse(Patient patient) {
        return toResponse(patient, null);
    }

    public PatientResponse toResponse(Patient patient, com.ayursutra.entity.User user) {
        if (patient == null) {
            return null;
        }

        PatientResponse res = new PatientResponse(
                patient.getId(),
                patient.getUserId(),
                patient.getFullName(),
                patient.getEmail(),
                patient.getPhone(),
                patient.getAge(),
                patient.getGender(),
                patient.getAddress(),
                patient.getMedicalHistory()
        );
        res.setPrimaryDosha(patient.getPrimaryDosha());
        res.setVataPercentage(patient.getVataPercentage());
        res.setPittaPercentage(patient.getPittaPercentage());
        res.setKaphaPercentage(patient.getKaphaPercentage());
        res.setPrakritiNotes(patient.getPrakritiNotes());

        if (user != null) {
            res.setProfilePictureUrl(user.getProfilePictureUrl());
            res.setDateOfBirth(user.getDateOfBirth());
            res.setBloodGroup(user.getBloodGroup());
            res.setEmergencyContact(user.getEmergencyContact());
            if (res.getFullName() == null || res.getFullName().isBlank()) {
                res.setFullName(user.getFullName());
            }
            if (res.getPhone() == null || res.getPhone().isBlank()) {
                res.setPhone(user.getPhone());
            }
        }

        return res;
    }

    public void updateEntity(
            Patient patient,
            UpdatePatientRequest request) {

        if (request.getFullName() != null)
            patient.setFullName(request.getFullName());

        if (request.getEmail() != null)
            patient.setEmail(request.getEmail());

        if (request.getPhone() != null)
            patient.setPhone(request.getPhone());

        if (request.getAge() != null)
            patient.setAge(request.getAge());

        if (request.getGender() != null)
            patient.setGender(request.getGender());

        if (request.getAddress() != null)
            patient.setAddress(request.getAddress());

        if (request.getMedicalHistory() != null)
            patient.setMedicalHistory(request.getMedicalHistory());
    }
}