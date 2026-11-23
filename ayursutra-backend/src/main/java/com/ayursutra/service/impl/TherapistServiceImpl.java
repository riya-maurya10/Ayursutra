package com.ayursutra.service.impl;

import com.ayursutra.dto.request.TherapistRequest;
import com.ayursutra.dto.response.PatientResponse;
import com.ayursutra.dto.response.TherapistResponse;
import com.ayursutra.entity.Therapist;
import com.ayursutra.entity.TherapySession;
import com.ayursutra.entity.User;
import com.ayursutra.mapper.TherapistMapper;
import com.ayursutra.repository.PatientRepository;
import com.ayursutra.repository.TherapistRepository;
import com.ayursutra.repository.TherapySessionRepository;
import com.ayursutra.security.UserPrincipal;
import com.ayursutra.service.TherapistService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TherapistServiceImpl implements TherapistService {

    private final TherapistRepository therapistRepository;
    private final TherapistMapper therapistMapper;
    private final TherapySessionRepository therapySessionRepository;
    private final PatientRepository patientRepository;
    private final com.ayursutra.repository.UserRepository userRepository;

    @Override
    public TherapistResponse createTherapist(
            TherapistRequest request) {

        if (therapistRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException(
                    "Therapist with this email already exists"
            );
        }

        Therapist therapist =
                therapistMapper.toEntity(request);

        Therapist savedTherapist =
                therapistRepository.save(therapist);

        return therapistMapper.toResponse(savedTherapist);
    }

    @Override
    public List<TherapistResponse> getAllTherapists() {

        return therapistRepository.findAll()
                .stream()
                .map(therapistMapper::toResponse)
                .toList();
    }

    @Override
    public TherapistResponse getMyProfile() {

        UserPrincipal principal =
                (UserPrincipal)
                        SecurityContextHolder
                                .getContext()
                                .getAuthentication()
                                .getPrincipal();

        User user = userRepository.findById(principal.getUser().getId())
                .orElse(principal.getUser());

        String userId = user.getId();

        Therapist therapist = therapistRepository.findByUserId(userId)
                .or(() -> therapistRepository.findByEmail(user.getEmail()).map(th -> {
                    th.setUserId(userId);
                    return therapistRepository.save(th);
                }))
                .orElseGet(() -> {
                    Therapist th = new Therapist();
                    th.setUserId(userId);
                    th.setFullName(user.getFullName());
                    th.setEmail(user.getEmail());
                    th.setPhone(user.getPhone());
                    th.setAddress(user.getAddress());
                    th.setAvailable(true);
                    return therapistRepository.save(th);
                });

        return therapistMapper.toResponse(therapist, user);
    }

    @Override
    public TherapistResponse updateMyProfile(com.ayursutra.dto.request.UpdateTherapistProfileRequest request) {
        UserPrincipal principal =
                (UserPrincipal)
                        SecurityContextHolder
                                .getContext()
                                .getAuthentication()
                                .getPrincipal();

        User user = userRepository.findById(principal.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Therapist therapist = therapistRepository.findByUserId(user.getId())
                .or(() -> therapistRepository.findByEmail(user.getEmail()).map(th -> {
                    th.setUserId(user.getId());
                    return therapistRepository.save(th);
                }))
                .orElseGet(() -> {
                    Therapist th = new Therapist();
                    th.setUserId(user.getId());
                    th.setFullName(user.getFullName());
                    th.setEmail(user.getEmail());
                    th.setPhone(user.getPhone());
                    th.setAddress(user.getAddress());
                    th.setAvailable(true);
                    return therapistRepository.save(th);
                });

        // Update Therapist role-specific fields
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            therapist.setFullName(request.getFullName().trim());
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            therapist.setPhone(request.getPhone().trim());
            user.setPhone(request.getPhone().trim());
        }
        if (request.getSpecialization() != null) {
            therapist.setSpecialization(request.getSpecialization().trim());
        }
        if (request.getQualification() != null) {
            therapist.setQualification(request.getQualification().trim());
        }
        if (request.getExperienceYears() != null) {
            therapist.setExperienceYears(request.getExperienceYears());
        }
        if (request.getTherapistType() != null) {
            therapist.setTherapistType(request.getTherapistType().trim());
        }
        if (request.getTherapySkills() != null) {
            therapist.setTherapySkills(request.getTherapySkills());
        }
        if (request.getTrainingCertifications() != null) {
            therapist.setTrainingCertifications(request.getTrainingCertifications().trim());
        }
        if (request.getAddress() != null) {
            therapist.setAddress(request.getAddress().trim());
            user.setAddress(request.getAddress().trim());
        }
        if (request.getAvailable() != null) {
            therapist.setAvailable(request.getAvailable());
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
        Therapist updatedTherapist = therapistRepository.save(therapist);

        return therapistMapper.toResponse(updatedTherapist, user);
    }

    @Override
    public List<PatientResponse> getMyPatients() {

        UserPrincipal principal =
                (UserPrincipal)
                        SecurityContextHolder
                                .getContext()
                                .getAuthentication()
                                .getPrincipal();

        User user = principal.getUser();

        String userId = user.getId();

        Therapist therapist =
                therapistRepository.findByUserId(userId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Therapist profile not found"
                                ));

        String therapistId = therapist.getId();

        List<TherapySession> sessions =
                therapySessionRepository.findByTherapistId(therapistId);

        List<String> patientIds =
                sessions.stream()
                        .map(TherapySession::getPatientId)
                        .filter(Objects::nonNull)
                        .distinct()
                        .toList();

        return patientIds.stream()
                .map(patientRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(patient -> new PatientResponse(
                        patient.getId(),
                        patient.getUserId(),
                        patient.getFullName(),
                        patient.getEmail(),
                        patient.getPhone(),
                        patient.getAge(),
                        patient.getGender(),
                        patient.getAddress(),
                        patient.getMedicalHistory()
                ))
                .toList();
    }

    @Override
    public TherapistResponse getTherapistById(String id) {

        Therapist therapist =
                therapistRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Therapist not found"
                                ));

        return therapistMapper.toResponse(therapist);
    }

    @Override
    public TherapistResponse updateTherapist(
            String id,
            TherapistRequest request) {

        Therapist therapist =
                therapistRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Therapist not found"
                                ));

        UserPrincipal principal =
                (UserPrincipal)
                        SecurityContextHolder
                                .getContext()
                                .getAuthentication()
                                .getPrincipal();

        User user = principal.getUser();

        boolean isTherapist =
                user.getRole() != null &&
                        user.getRole().name().equals("THERAPIST");

        if (isTherapist &&
                !user.getId().equals(therapist.getUserId())) {

            throw new RuntimeException(
                    "You are not allowed to update this therapist profile"
            );
        }

        therapist.setUserId(request.getUserId());
        therapist.setFullName(request.getFullName());
        therapist.setEmail(request.getEmail());
        therapist.setPhone(request.getPhone());
        therapist.setSpecialization(request.getSpecialization());
        therapist.setQualification(request.getQualification());
        therapist.setExperienceYears(
                request.getExperienceYears()
        );
        therapist.setTherapistType(
                request.getTherapistType()
        );
        therapist.setAvailable(request.isAvailable());

        Therapist updatedTherapist =
                therapistRepository.save(therapist);

        return therapistMapper.toResponse(updatedTherapist);
    }
    @Override
    public void deleteTherapist(String id) {

        if (!therapistRepository.existsById(id)) {
            throw new RuntimeException(
                    "Therapist not found"
            );
        }

        therapistRepository.deleteById(id);
    }
}