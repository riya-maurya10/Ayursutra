package com.ayursutra.mapper;

import com.ayursutra.dto.response.ReceptionistResponse;
import com.ayursutra.entity.Receptionist;
import com.ayursutra.entity.User;
import org.springframework.stereotype.Component;

@Component
public class ReceptionistMapper {

    public ReceptionistResponse toResponse(Receptionist receptionist, User user) {
        if (receptionist == null) {
            return null;
        }

        ReceptionistResponse.ReceptionistResponseBuilder builder = ReceptionistResponse.builder()
                .id(receptionist.getId())
                .userId(receptionist.getUserId())
                .fullName(receptionist.getFullName())
                .email(receptionist.getEmail())
                .phone(receptionist.getPhone())
                .address(receptionist.getAddress())
                .idProofDocumentUrl(receptionist.getIdProofDocumentUrl())
                .clinicId(receptionist.getClinicId())
                .available(receptionist.isAvailable());

        if (user != null) {
            builder.profilePictureUrl(user.getProfilePictureUrl())
                    .gender(user.getGender())
                    .dateOfBirth(user.getDateOfBirth());
            if (builder.build().getFullName() == null || builder.build().getFullName().isBlank()) {
                builder.fullName(user.getFullName());
            }
            if (builder.build().getPhone() == null || builder.build().getPhone().isBlank()) {
                builder.phone(user.getPhone());
            }
        }

        return builder.build();
    }
}
