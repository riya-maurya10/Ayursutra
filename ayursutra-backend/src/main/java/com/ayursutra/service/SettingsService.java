package com.ayursutra.service;

import com.ayursutra.dto.request.ClinicSettingsRequest;
import com.ayursutra.dto.request.UserSettingsRequest;
import com.ayursutra.dto.response.ClinicSettingsResponse;
import com.ayursutra.dto.response.UserSettingsResponse;

public interface SettingsService {

    ClinicSettingsResponse getClinicSettings(String clinicId);

    ClinicSettingsResponse updateClinicSettings(String clinicId, ClinicSettingsRequest request);

    UserSettingsResponse getUserSettings(String userId);

    UserSettingsResponse updateUserSettings(String userId, UserSettingsRequest request);
}
