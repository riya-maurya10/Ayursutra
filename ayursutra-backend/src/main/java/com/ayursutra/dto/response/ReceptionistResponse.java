package com.ayursutra.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceptionistResponse {

    private String id;

    private String userId;

    private String fullName;

    private String email;

    private String phone;

    private String address;

    private String idProofDocumentUrl;

    private String clinicId;

    private boolean available;

    private String profilePictureUrl;

    private String gender;

    private java.time.LocalDate dateOfBirth;
}
