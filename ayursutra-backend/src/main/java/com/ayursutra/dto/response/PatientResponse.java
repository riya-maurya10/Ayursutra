package com.ayursutra.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientResponse {

    private String id;

    private String userId;

    private String fullName;

    private String email;

    private String phone;

    private Integer age;

    private String gender;

    private String address;

    private String medicalHistory;

    private String primaryDosha;

    private Integer vataPercentage;

    private Integer pittaPercentage;

    private Integer kaphaPercentage;

    private String prakritiNotes;

    private String profilePictureUrl;

    private java.time.LocalDate dateOfBirth;

    private String bloodGroup;

    private String emergencyContact;

    public PatientResponse(String id, String userId, String fullName, String email, String phone,
                           Integer age, String gender, String address, String medicalHistory) {
        this.id = id;
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.age = age;
        this.gender = gender;
        this.address = address;
        this.medicalHistory = medicalHistory;
    }
}