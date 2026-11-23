package com.ayursutra.mapper;

import com.ayursutra.dto.response.UserResponse;
import com.ayursutra.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public static UserResponse toResponse(User user){

        UserResponse response = new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.isEnabled()
        );
        response.setVerificationStatus(user.getEffectiveVerificationStatus());
        response.setRejectionReason(user.getRejectionReason());
        response.setClinicId(user.getClinicId() != null ? user.getClinicId() : "CLINIC-MAIN");
        response.setProfilePictureUrl(user.getProfilePictureUrl());
        response.setGender(user.getGender());
        response.setDateOfBirth(user.getDateOfBirth());
        response.setEmergencyContact(user.getEmergencyContact());
        response.setBloodGroup(user.getBloodGroup());
        response.setAddress(user.getAddress());
        response.setLastLogin(user.getLastLogin());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }

}