package com.ayursutra.service.impl;

import com.ayursutra.constant.NotificationType;
import com.ayursutra.constant.Role;
import com.ayursutra.dto.request.RegisterUserRequest;
import com.ayursutra.dto.request.UpdateUserProfileRequest;
import com.ayursutra.dto.response.UserResponse;
import com.ayursutra.entity.User;
import com.ayursutra.mapper.UserMapper;
import com.ayursutra.repository.DoctorRepository;
import com.ayursutra.repository.PatientRepository;
import com.ayursutra.repository.ReceptionistRepository;
import com.ayursutra.repository.TherapistRepository;
import com.ayursutra.repository.UserRepository;
import com.ayursutra.security.UserPrincipal;
import com.ayursutra.service.NotificationService;
import com.ayursutra.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final DoctorRepository doctorRepository;
    private final TherapistRepository therapistRepository;
    private final ReceptionistRepository receptionistRepository;
    private final PatientRepository patientRepository;
    private final NotificationService notificationService;

    @Override
    public UserResponse register(RegisterUserRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole(request.getRole());
        user.setEnabled(true);

        userRepository.save(user);

        if (user.getRole() == Role.PATIENT) {
            notificationService.sendNotificationToRole(
                    Role.ADMIN,
                    "New Patient Registration",
                    "A new patient " + user.getFullName() + " has registered online.",
                    NotificationType.PATIENT_REGISTRATION,
                    "/admin/patients"
            );
            notificationService.sendNotificationToRole(
                    Role.RECEPTIONIST,
                    "New Patient Registration",
                    "A new patient " + user.getFullName() + " has registered online.",
                    NotificationType.PATIENT_REGISTRATION,
                    "/receptionist/patients"
            );
        }

        return UserMapper.toResponse(user);
    }

    @Override
    public List<UserResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(UserMapper::toResponse)
                .toList();
    }

    @Override
    public UserResponse deactivateUser(String userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        user.setEnabled(false);

        userRepository.save(user);

        return UserMapper.toResponse(user);
    }

    @Override
    public UserResponse activateUser(String userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        user.setEnabled(true);

        userRepository.save(user);

        return UserMapper.toResponse(user);
    }

    @Override
    public UserResponse getMyProfile() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(principal.getUser().getId())
                .orElse(principal.getUser());
        return UserMapper.toResponse(user);
    }

    @Override
    public UserResponse updateMyProfile(UpdateUserProfileRequest request) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(principal.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhone(request.getPhone().trim());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender().trim());
        }
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getProfilePictureUrl() != null) {
            user.setProfilePictureUrl(request.getProfilePictureUrl().trim());
        }
        if (request.getEmergencyContact() != null) {
            user.setEmergencyContact(request.getEmergencyContact().trim());
        }
        if (request.getBloodGroup() != null) {
            user.setBloodGroup(request.getBloodGroup().trim());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress().trim());
        }

        userRepository.save(user);

        // Synchronize corresponding role entity if present
        if (user.getRole() != null) {
            switch (user.getRole()) {
                case DOCTOR -> doctorRepository.findByUserId(user.getId()).ifPresent(doctor -> {
                    doctor.setFullName(user.getFullName());
                    doctor.setPhone(user.getPhone());
                    if (user.getAddress() != null) doctor.setAddress(user.getAddress());
                    doctorRepository.save(doctor);
                });
                case THERAPIST -> therapistRepository.findByUserId(user.getId()).ifPresent(therapist -> {
                    therapist.setFullName(user.getFullName());
                    therapist.setPhone(user.getPhone());
                    if (user.getAddress() != null) therapist.setAddress(user.getAddress());
                    therapistRepository.save(therapist);
                });
                case RECEPTIONIST -> receptionistRepository.findByUserId(user.getId()).ifPresent(receptionist -> {
                    receptionist.setFullName(user.getFullName());
                    receptionist.setPhone(user.getPhone());
                    if (user.getAddress() != null) receptionist.setAddress(user.getAddress());
                    receptionistRepository.save(receptionist);
                });
                case PATIENT -> patientRepository.findByUserId(user.getId()).ifPresent(patient -> {
                    patient.setFullName(user.getFullName());
                    patient.setPhone(user.getPhone());
                    if (user.getAddress() != null) patient.setAddress(user.getAddress());
                    if (user.getGender() != null) patient.setGender(user.getGender());
                    patientRepository.save(patient);
                });
                default -> {}
            }
        }

        return UserMapper.toResponse(user);
    }
}