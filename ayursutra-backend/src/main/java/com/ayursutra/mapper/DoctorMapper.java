package com.ayursutra.mapper;

import com.ayursutra.dto.request.DoctorRequest;
import com.ayursutra.dto.response.DoctorResponse;
import com.ayursutra.entity.Doctor;
import com.ayursutra.entity.User;
import org.springframework.stereotype.Component;

@Component
public class DoctorMapper {

    public Doctor toEntity(DoctorRequest request) {

        Doctor doctor = new Doctor();

        doctor.setUserId(request.getUserId());
        doctor.setFullName(request.getFullName());
        doctor.setEmail(request.getEmail());
        doctor.setPhone(request.getPhone());
        doctor.setSpecialization(request.getSpecialization());
        doctor.setQualification(request.getQualification());
        doctor.setExperienceYears(request.getExperienceYears());
        doctor.setLicenseNumber(request.getLicenseNumber());
        doctor.setAvailable(request.isAvailable());

        return doctor;
    }

    public DoctorResponse toResponse(Doctor doctor) {
        return toResponse(doctor, null);
    }

    public DoctorResponse toResponse(Doctor doctor, User user) {
        if (doctor == null) {
            return null;
        }

        DoctorResponse res = new DoctorResponse(
                doctor.getId(),
                doctor.getUserId(),
                doctor.getFullName(),
                doctor.getEmail(),
                doctor.getPhone(),
                doctor.getSpecialization(),
                doctor.getQualification(),
                doctor.getExperienceYears(),
                doctor.getLicenseNumber(),
                doctor.isAvailable()
        );
        res.setStateCouncil(doctor.getStateCouncil());
        res.setAddress(doctor.getAddress());
        res.setDegreeCertificateUrl(doctor.getDegreeCertificateUrl());
        res.setRegistrationCertificateUrl(doctor.getRegistrationCertificateUrl());
        res.setAdditionalCertificatesUrl(doctor.getAdditionalCertificatesUrl());
        res.setClinicId(doctor.getClinicId() != null ? doctor.getClinicId() : "CLINIC-MAIN");

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