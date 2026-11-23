package com.ayursutra.mapper;

import com.ayursutra.dto.request.TherapistRequest;
import com.ayursutra.dto.response.TherapistResponse;
import com.ayursutra.entity.Therapist;
import org.springframework.stereotype.Component;

@Component
public class TherapistMapper {

    public Therapist toEntity(TherapistRequest request) {

        Therapist therapist = new Therapist();

        therapist.setUserId(request.getUserId());
        therapist.setFullName(request.getFullName());
        therapist.setEmail(request.getEmail());
        therapist.setPhone(request.getPhone());
        therapist.setSpecialization(request.getSpecialization());
        therapist.setQualification(request.getQualification());
        therapist.setExperienceYears(request.getExperienceYears());
        therapist.setTherapistType(request.getTherapistType());
        therapist.setAvailable(request.isAvailable());

        return therapist;
    }

    public TherapistResponse toResponse(Therapist therapist) {
        return toResponse(therapist, null);
    }

    public TherapistResponse toResponse(Therapist therapist, com.ayursutra.entity.User user) {
        if (therapist == null) {
            return null;
        }

        TherapistResponse res = new TherapistResponse(
                therapist.getId(),
                therapist.getUserId(),
                therapist.getFullName(),
                therapist.getEmail(),
                therapist.getPhone(),
                therapist.getSpecialization(),
                therapist.getQualification(),
                therapist.getExperienceYears(),
                therapist.getTherapistType(),
                therapist.isAvailable()
        );
        res.setTherapySkills(therapist.getTherapySkills());
        res.setTrainingCertifications(therapist.getTrainingCertifications());
        res.setQualificationCertificateUrl(therapist.getQualificationCertificateUrl());
        res.setTrainingCertificateUrl(therapist.getTrainingCertificateUrl());
        res.setAddress(therapist.getAddress());
        res.setClinicId(therapist.getClinicId() != null ? therapist.getClinicId() : "CLINIC-MAIN");

        if (user != null) {
            res.setProfilePictureUrl(user.getProfilePictureUrl());
            res.setGender(user.getGender());
            res.setDateOfBirth(user.getDateOfBirth());
            if (res.getFullName() == null || res.getFullName().isBlank()) {
                res.setFullName(user.getFullName());
            }
            if (res.getPhone() == null || res.getPhone().isBlank()) {
                res.setPhone(user.getPhone());
            }
        }

        return res;
    }
}