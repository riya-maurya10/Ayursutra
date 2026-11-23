package com.ayursutra.service;

import com.ayursutra.dto.request.UpdateReceptionistProfileRequest;
import com.ayursutra.dto.response.ReceptionistResponse;

import java.util.List;

public interface ReceptionistService {

    ReceptionistResponse getMyProfile();

    ReceptionistResponse updateMyProfile(UpdateReceptionistProfileRequest request);

    List<ReceptionistResponse> getAllReceptionists();

    ReceptionistResponse getReceptionistById(String id);
}
