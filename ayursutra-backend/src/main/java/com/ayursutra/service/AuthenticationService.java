package com.ayursutra.service;

import com.ayursutra.dto.request.ForgotPasswordRequest;
import com.ayursutra.dto.request.LoginRequest;
import com.ayursutra.dto.request.ResetPasswordRequest;
import com.ayursutra.dto.request.VerifyOtpRequest;
import com.ayursutra.dto.response.LoginResponse;

public interface AuthenticationService {

    LoginResponse login(LoginRequest request);

    String forgotPassword(ForgotPasswordRequest request);

    void verifyOtp(VerifyOtpRequest request);

    void resetPassword(ResetPasswordRequest request);

    void changePassword(com.ayursutra.dto.request.ChangePasswordRequest request, String userEmail);

}
