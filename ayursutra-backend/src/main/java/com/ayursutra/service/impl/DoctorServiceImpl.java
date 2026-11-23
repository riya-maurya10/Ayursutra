package com.ayursutra.service.impl;

import com.ayursutra.dto.request.DoctorRequest;
import com.ayursutra.dto.response.DoctorResponse;
import com.ayursutra.entity.Doctor;
import com.ayursutra.entity.User;
import com.ayursutra.mapper.DoctorMapper;
import com.ayursutra.repository.DoctorRepository;
import com.ayursutra.security.UserPrincipal;
import com.ayursutra.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;
    private final com.ayursutra.repository.UserRepository userRepository;
    private final DoctorMapper doctorMapper;

    @Override
    public DoctorResponse createDoctor(DoctorRequest request) {

        if (doctorRepository.existsByLicenseNumber(request.getLicenseNumber())) {
            throw new RuntimeException(
                    "Doctor with this license number already exists"
            );
        }

        Doctor doctor = doctorMapper.toEntity(request);

        Doctor savedDoctor = doctorRepository.save(doctor);

        return doctorMapper.toResponse(savedDoctor);
    }

    @Override
    public List<DoctorResponse> getAllDoctors() {

        return doctorRepository.findAll()
                .stream()
                .map(doctorMapper::toResponse)
                .toList();
    }

    @Override
    public DoctorResponse getDoctorById(String id) {

        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Doctor not found"));

        return doctorMapper.toResponse(doctor);
    }

    @Override
    public DoctorResponse getMyProfile() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !(authentication.getPrincipal() instanceof UserPrincipal)) {

            throw new RuntimeException("User not authenticated");
        }

        UserPrincipal userPrincipal =
                (UserPrincipal) authentication.getPrincipal();

        User user = userRepository.findById(userPrincipal.getUser().getId())
                .orElse(userPrincipal.getUser());

        Doctor doctor = doctorRepository.findByUserId(user.getId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Doctor profile not found"
                        ));

        return doctorMapper.toResponse(doctor, user);
    }

    @Override
    public DoctorResponse updateMyProfile(com.ayursutra.dto.request.UpdateDoctorProfileRequest request) {
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !(authentication.getPrincipal() instanceof UserPrincipal)) {
            throw new RuntimeException("User not authenticated");
        }

        UserPrincipal userPrincipal =
                (UserPrincipal) authentication.getPrincipal();

        User user = userRepository.findById(userPrincipal.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Doctor doctor = doctorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Doctor profile not found"));

        // Update Doctor role-specific fields
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            doctor.setFullName(request.getFullName().trim());
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            doctor.setPhone(request.getPhone().trim());
            user.setPhone(request.getPhone().trim());
        }
        if (request.getSpecialization() != null) {
            doctor.setSpecialization(request.getSpecialization().trim());
        }
        if (request.getQualification() != null) {
            doctor.setQualification(request.getQualification().trim());
        }
        if (request.getExperienceYears() != null) {
            doctor.setExperienceYears(request.getExperienceYears());
        }
        if (request.getAddress() != null) {
            doctor.setAddress(request.getAddress().trim());
            user.setAddress(request.getAddress().trim());
        }
        if (request.getAvailable() != null) {
            doctor.setAvailable(request.getAvailable());
        }

        // Update User personal fields
        if (request.getGender() != null) {
            user.setGender(request.getGender().trim());
        }
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getProfilePictureUrl() != null) {
            user.setProfilePictureUrl(request.getProfilePictureUrl().trim());
        }

        userRepository.save(user);
        Doctor updatedDoctor = doctorRepository.save(doctor);

        return doctorMapper.toResponse(updatedDoctor, user);
    }

    @Override
    public DoctorResponse updateDoctor(
            String id,
            DoctorRequest request) {

        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Doctor not found"));

        doctor.setUserId(request.getUserId());
        doctor.setFullName(request.getFullName());
        doctor.setEmail(request.getEmail());
        doctor.setPhone(request.getPhone());
        doctor.setSpecialization(request.getSpecialization());
        doctor.setQualification(request.getQualification());
        doctor.setExperienceYears(request.getExperienceYears());
        doctor.setLicenseNumber(request.getLicenseNumber());
        doctor.setAvailable(request.isAvailable());

        Doctor updatedDoctor = doctorRepository.save(doctor);

        return doctorMapper.toResponse(updatedDoctor);
    }

    @Override
    public void deleteDoctor(String id) {

        if (!doctorRepository.existsById(id)) {
            throw new RuntimeException("Doctor not found");
        }

        doctorRepository.deleteById(id);
    }
}