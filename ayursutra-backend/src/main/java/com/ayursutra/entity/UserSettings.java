package com.ayursutra.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "user_settings")
public class UserSettings extends BaseEntity {

    @Indexed(unique = true)
    private String userId;

    @Builder.Default
    private String theme = "light";

    @Builder.Default
    private String language = "en";

    @Builder.Default
    private String dateFormat = "DD/MM/YYYY";

    @Builder.Default
    private String timeZone = "Asia/Kolkata";

    @Builder.Default
    private Boolean emailNotifications = true;

    @Builder.Default
    private Boolean appointmentAlerts = true;

    @Builder.Default
    private Boolean therapyReminders = true;

    @Builder.Default
    private Boolean billingAlerts = true;

    @Builder.Default
    private String workingHoursStart = "09:00";

    @Builder.Default
    private String workingHoursEnd = "18:00";

    private List<String> workingDays;

    @Builder.Default
    private Boolean teleconsultationEnabled = true;

    @Builder.Default
    private String profileVisibility = "CLINIC_WIDE";
}
