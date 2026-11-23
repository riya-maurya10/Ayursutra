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
@Document(collection = "compliance_chapters")
public class ComplianceChapter extends BaseEntity {

    private String code;

    private String name;

    private String description;

    private Integer displayOrder;

    private boolean active = true;
}