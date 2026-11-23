package com.ayursutra.service.impl;

import com.ayursutra.constant.NotificationType;
import com.ayursutra.constant.Role;
import com.ayursutra.dto.request.CreatePatientRequest;
import com.ayursutra.dto.request.UpdatePatientRequest;
import com.ayursutra.dto.response.PatientResponse;
import com.ayursutra.entity.Patient;
import com.ayursutra.entity.User;
import com.ayursutra.mapper.PatientMapper;
import com.ayursutra.repository.PatientRepository;
import com.ayursutra.security.UserPrincipal;
import com.ayursutra.service.NotificationService;
import com.ayursutra.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;
    private final PatientMapper patientMapper;
    private final com.ayursutra.repository.UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    public PatientResponse createPatient(CreatePatientRequest request) {

        if (patientRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException(
                    "Patient with this email already exists"
            );
        }

        if (patientRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException(
                    "Patient with this phone already exists"
            );
        }

        Patient patient = patientMapper.toEntity(request);

        Patient savedPatient = patientRepository.save(patient);

        notificationService.sendNotificationToRole(
                Role.ADMIN,
                "New Patient Registered",
                "Patient " + savedPatient.getFullName() + " was registered.",
                NotificationType.PATIENT_REGISTRATION,
                "/admin/patients"
        );
        notificationService.sendNotificationToRole(
                Role.RECEPTIONIST,
                "New Patient Registered",
                "Patient " + savedPatient.getFullName() + " was registered.",
                NotificationType.PATIENT_REGISTRATION,
                "/receptionist/patients"
        );

        return patientMapper.toResponse(savedPatient);
    }

    @Override
    public List<PatientResponse> getAllPatients() {

        return patientRepository.findAll()
                .stream()
                .map(patientMapper::toResponse)
                .toList();
    }

    @Override
    public PatientResponse getPatientById(String id) {

        Patient patient = patientRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Patient not found"));

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        UserPrincipal principal =
                (UserPrincipal) authentication.getPrincipal();

        String loggedInUserId = principal.getUser().getId();

        // PATIENT can only access their own profile
        if (principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"))) {

            if (!patient.getUserId().equals(loggedInUserId)) {
                throw new RuntimeException("Access Denied");
            }
        }

        return patientMapper.toResponse(patient);
    }

    @Override
    public PatientResponse updatePatient(
            String id,
            UpdatePatientRequest request) {

        Patient patient = patientRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Patient not found"));

        patientMapper.updateEntity(patient, request);

        Patient updatedPatient =
                patientRepository.save(patient);

        return patientMapper.toResponse(updatedPatient);
    }

    @Override
    public void deletePatient(String id) {

        if (!patientRepository.existsById(id)) {
            throw new RuntimeException("Patient not found");
        }

        patientRepository.deleteById(id);
    }

    @Override
    public PatientResponse createMyProfile(
            UpdatePatientRequest request) {

        String userId = getLoggedInUserId();

        // Prevent duplicate patient profiles
        if (patientRepository.findByUserId(userId).isPresent()) {
            throw new RuntimeException(
                    "Patient profile already exists"
            );
        }

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        UserPrincipal principal =
                (UserPrincipal) authentication.getPrincipal();

        Patient patient = new Patient();

        patient.setUserId(userId);
        patient.setFullName(principal.getUser().getFullName());
        patient.setEmail(principal.getUser().getEmail());
        //patient.setPhone(principal.getUser().getPhone());
        patient.setPhone(request.getPhone());
        patient.setAge(request.getAge());
        patient.setGender(request.getGender());
        patient.setAddress(request.getAddress());
        patient.setMedicalHistory(request.getMedicalHistory());

        Patient savedPatient =
                patientRepository.save(patient);

        return patientMapper.toResponse(savedPatient);
    }

    @Override
    public PatientResponse getMyProfile() {

        String userId = getLoggedInUserId();

        User user = userRepository.findById(userId).orElse(null);

        Patient patient = patientRepository.findByUserId(userId)
                .or(() -> patientRepository.findByEmail(user != null ? user.getEmail() : "").map(p -> {
                    p.setUserId(userId);
                    return patientRepository.save(p);
                }))
                .orElseGet(() -> {
                    Patient p = new Patient();
                    p.setUserId(userId);
                    if (user != null) {
                        p.setFullName(user.getFullName());
                        p.setEmail(user.getEmail());
                        p.setPhone(user.getPhone());
                        p.setGender(user.getGender());
                        p.setAddress(user.getAddress());
                    }
                    return patientRepository.save(p);
                });

        return patientMapper.toResponse(patient, user);
    }

    @Override
    public PatientResponse updateMyProfile(
            UpdatePatientRequest request) {

        String userId = getLoggedInUserId();

        User user = userRepository.findById(userId).orElse(null);

        Patient patient = patientRepository.findByUserId(userId)
                .or(() -> patientRepository.findByEmail(user != null ? user.getEmail() : "").map(p -> {
                    p.setUserId(userId);
                    return patientRepository.save(p);
                }))
                .orElseGet(() -> {
                    Patient p = new Patient();
                    p.setUserId(userId);
                    if (user != null) {
                        p.setFullName(user.getFullName());
                        p.setEmail(user.getEmail());
                        p.setPhone(user.getPhone());
                        p.setGender(user.getGender());
                        p.setAddress(user.getAddress());
                    }
                    return patientRepository.save(p);
                });

        patientMapper.updateEntity(patient, request);

        Patient updatedPatient =
                patientRepository.save(patient);

        if (user != null) {
            if (patient.getFullName() != null && !patient.getFullName().isBlank()) {
                user.setFullName(patient.getFullName().trim());
            }
            if (patient.getPhone() != null && !patient.getPhone().isBlank()) {
                user.setPhone(patient.getPhone().trim());
            }
            if (patient.getAddress() != null) {
                user.setAddress(patient.getAddress().trim());
            }
            if (patient.getGender() != null) {
                user.setGender(patient.getGender().trim());
            }
            userRepository.save(user);
        }

        return patientMapper.toResponse(updatedPatient, user);
    }

    private String getLoggedInUserId() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        UserPrincipal principal =
                (UserPrincipal) authentication.getPrincipal();

        return principal.getUser().getId();
    }
}