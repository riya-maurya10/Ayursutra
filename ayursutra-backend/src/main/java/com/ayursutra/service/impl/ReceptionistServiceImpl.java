package com.ayursutra.service.impl;

import com.ayursutra.dto.request.UpdateReceptionistProfileRequest;
import com.ayursutra.dto.response.ReceptionistResponse;
import com.ayursutra.entity.Receptionist;
import com.ayursutra.entity.User;
import com.ayursutra.mapper.ReceptionistMapper;
import com.ayursutra.repository.ReceptionistRepository;
import com.ayursutra.repository.UserRepository;
import com.ayursutra.security.UserPrincipal;
import com.ayursutra.service.ReceptionistService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReceptionistServiceImpl implements ReceptionistService {

    private final ReceptionistRepository receptionistRepository;
    private final UserRepository userRepository;
    private final ReceptionistMapper receptionistMapper;

    @Override
    public ReceptionistResponse getMyProfile() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(principal.getUser().getId())
                .orElse(principal.getUser());

        Receptionist receptionist = receptionistRepository.findByUserId(user.getId())
                .or(() -> receptionistRepository.findByEmail(user.getEmail()).map(rec -> {
                    rec.setUserId(user.getId());
                    return receptionistRepository.save(rec);
                }))
                .orElseGet(() -> {
                    Receptionist newRec = new Receptionist();
                    newRec.setUserId(user.getId());
                    newRec.setFullName(user.getFullName());
                    newRec.setEmail(user.getEmail());
                    newRec.setPhone(user.getPhone());
                    newRec.setAddress(user.getAddress());
                    newRec.setClinicId(user.getClinicId() != null ? user.getClinicId() : "CLINIC-MAIN");
                    newRec.setAvailable(true);
                    return receptionistRepository.save(newRec);
                });

        return receptionistMapper.toResponse(receptionist, user);
    }

    @Override
    public ReceptionistResponse updateMyProfile(UpdateReceptionistProfileRequest request) {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(principal.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Receptionist receptionist = receptionistRepository.findByUserId(user.getId())
                .or(() -> receptionistRepository.findByEmail(user.getEmail()).map(rec -> {
                    rec.setUserId(user.getId());
                    return receptionistRepository.save(rec);
                }))
                .orElseGet(() -> {
                    Receptionist newRec = new Receptionist();
                    newRec.setUserId(user.getId());
                    newRec.setFullName(user.getFullName());
                    newRec.setEmail(user.getEmail());
                    newRec.setPhone(user.getPhone());
                    newRec.setAddress(user.getAddress());
                    newRec.setClinicId(user.getClinicId() != null ? user.getClinicId() : "CLINIC-MAIN");
                    newRec.setAvailable(true);
                    return receptionistRepository.save(newRec);
                });

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            receptionist.setFullName(request.getFullName().trim());
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            receptionist.setPhone(request.getPhone().trim());
            user.setPhone(request.getPhone().trim());
        }
        if (request.getAddress() != null) {
            receptionist.setAddress(request.getAddress().trim());
            user.setAddress(request.getAddress().trim());
        }
        if (request.getAvailable() != null) {
            receptionist.setAvailable(request.getAvailable());
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

        userRepository.save(user);
        Receptionist updated = receptionistRepository.save(receptionist);

        return receptionistMapper.toResponse(updated, user);
    }

    @Override
    public List<ReceptionistResponse> getAllReceptionists() {
        return receptionistRepository.findAll().stream()
                .map(rec -> {
                    User u = userRepository.findById(rec.getUserId()).orElse(null);
                    return receptionistMapper.toResponse(rec, u);
                })
                .toList();
    }

    @Override
    public ReceptionistResponse getReceptionistById(String id) {
        Receptionist receptionist = receptionistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Receptionist not found"));
        User user = userRepository.findById(receptionist.getUserId()).orElse(null);
        return receptionistMapper.toResponse(receptionist, user);
    }
}
