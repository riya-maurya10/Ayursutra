package com.ayursutra.service;

import com.ayursutra.dto.request.ComplianceUpdateRequest;
import com.ayursutra.dto.response.ComplianceChapterResponse;
import com.ayursutra.entity.ComplianceChecklistItem;

import java.util.List;

public interface ComplianceService {

    List<ComplianceChapterResponse> getChapterSummary();

    List<ComplianceChecklistItem> getChecklist(
            String chapterCode
    );

    ComplianceChecklistItem updateChecklistItem(
            String id,
            ComplianceUpdateRequest request
    );

    double getOverallReadiness();
}