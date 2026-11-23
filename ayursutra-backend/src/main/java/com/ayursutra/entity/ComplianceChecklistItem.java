package com.ayursutra.entity;

import com.ayursutra.constant.ComplianceLevel;
import com.ayursutra.constant.ComplianceStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Document(collection = "compliance_checklist_items")
public class ComplianceChecklistItem extends BaseEntity {

    private String chapterCode;

    private String standardCode;

    private String objectiveElementCode;

    private String title;

    private String description;

    private ComplianceLevel level;

    private ComplianceStatus status = ComplianceStatus.NOT_STARTED;

    private String ownerRole;

    private List<String> evidenceReferences = new ArrayList<>();

    private String notes;

    private LocalDateTime lastReviewedAt;

    private LocalDateTime nextReviewAt;
}