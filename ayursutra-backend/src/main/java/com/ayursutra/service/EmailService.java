package com.ayursutra.service;

public interface EmailService {

    void sendPasswordResetOtp(String toEmail, String otp);

}
