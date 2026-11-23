package com.ayursutra.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSettingsResponse {

    private String id;

    private String userId;

    private String theme;

    private String language;

    private String dateFormat;

    private String timeZone;

    private Boolean emailNotifications;

    private Boolean appointmentAlerts;

    private Boolean therapyReminders;

    private Boolean billingAlerts;

    private String workingHoursStart;

    private String workingHoursEnd;

    private List<String> workingDays;

    private Boolean teleconsultationEnabled;

    private String profileVisibility;
}
