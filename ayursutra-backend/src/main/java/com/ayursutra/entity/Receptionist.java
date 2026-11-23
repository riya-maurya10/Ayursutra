package com.ayursutra.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Document(collection = "receptionists")
public class Receptionist extends BaseEntity {

    private String userId;

    private String fullName;

    private String email;

    private String phone;

    private String address;

    private String idProofDocumentUrl;

    private String clinicId;

    private boolean available = true;

}
