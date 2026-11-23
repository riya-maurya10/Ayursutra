package com.ayursutra.service.impl;

import com.ayursutra.dto.request.ForgotPasswordRequest;
import com.ayursutra.dto.request.LoginRequest;
import com.ayursutra.dto.request.ResetPasswordRequest;
import com.ayursutra.dto.request.VerifyOtpRequest;
import com.ayursutra.dto.response.LoginResponse;
import com.ayursutra.entity.User;
import com.ayursutra.repository.UserRepository;
import com.ayursutra.security.JwtService;
import com.ayursutra.service.AuthenticationService;
import com.ayursutra.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
public class AuthenticationServiceImpl implements AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public AuthenticationServiceImpl(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder) {
        this(authenticationManager, userRepository, jwtService, passwordEncoder, (to, otp) -> {});
    }

    @Autowired
    public AuthenticationServiceImpl(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            @Autowired(required = false) EmailService emailService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService != null ? emailService : (to, otp) -> {};
    }

    @Override
    public LoginResponse login(LoginRequest request) {

        // =========================================================
        // CHECK WHETHER USER EXISTS AND ACCOUNT IS ACTIVE
        // =========================================================

        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            throw new RuntimeException("Email is required");
        }

        String cleanEmail = request.getEmail().trim();
        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
                .or(() -> userRepository.findByEmail(cleanEmail))
                .orElseThrow(() ->
                        new RuntimeException("Invalid email or password")
                );

        com.ayursutra.constant.VerificationStatus status = user.getEffectiveVerificationStatus();
        if (status == com.ayursutra.constant.VerificationStatus.PENDING_VERIFICATION) {
            throw new DisabledException(
                    "Your staff registration is currently pending verification by clinic administration. You will be able to log in once your application has been reviewed and approved."
            );
        }
        if (status == com.ayursutra.constant.VerificationStatus.REJECTED) {
            String reason = (user.getRejectionReason() != null && !user.getRejectionReason().isBlank())
                    ? user.getRejectionReason()
                    : "Application rejected by clinic administration.";
            throw new DisabledException(
                    "Your staff application was rejected by administration: " + reason
            );
        }
        if (status == com.ayursutra.constant.VerificationStatus.SUSPENDED) {
            throw new DisabledException(
                    "Your staff account has been suspended by clinic administration. Please contact support."
            );
        }
        if (status == com.ayursutra.constant.VerificationStatus.INVITED ||
                status == com.ayursutra.constant.VerificationStatus.INVITATION_EXPIRED) {
            throw new DisabledException(
                    "Please complete your registration using the invitation link before logging in."
            );
        }

        if (!user.isEnabled()) {
            throw new DisabledException(
                    "Your account has been deactivated. Please contact the clinic administrator."
            );
        }

        // =========================================================
        // AUTHENTICATE USER
        // =========================================================

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        user.getEmail(),
                        request.getPassword()
                )
        );

        // =========================================================
        // GENERATE JWT
        // =========================================================

        String token = jwtService.generateToken(user.getEmail());

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        return LoginResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    @Override
    public void changePassword(com.ayursutra.dto.request.ChangePasswordRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password does not match.");
        }

        if (request.getNewPassword() == null || !request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("New password and confirm password do not match.");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new RuntimeException("New password cannot be the same as your current password.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    public String forgotPassword(ForgotPasswordRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            return "If an account is associated with this email, a 6-digit verification code has been sent.";
        }

        String normalizedEmail = request.getEmail().trim();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .or(() -> userRepository.findByEmail(normalizedEmail));

        if (userOpt.isEmpty()) {
            // Generic return prevents email enumeration
            log.info("Password reset requested for non-registered email: {}", normalizedEmail);
            return "If an account is associated with this email, a 6-digit verification code has been sent.";
        }

        User user = userOpt.get();

        // Resend cooldown & rate limiting: 60 seconds
        if (user.getLastResetPasswordRequestAt() != null &&
                user.getLastResetPasswordRequestAt().plusSeconds(60).isAfter(LocalDateTime.now())) {
            long remainingSeconds = Duration.between(
                    LocalDateTime.now(),
                    user.getLastResetPasswordRequestAt().plusSeconds(60)
            ).getSeconds();
            throw new RuntimeException("Please wait " + Math.max(1, remainingSeconds) + " seconds before requesting a new reset code.");
        }

        // Generate 6-digit cryptographically secure numeric OTP
        SecureRandom random = new SecureRandom();
        String otp = String.format("%06d", random.nextInt(1000000));

        // Store SHA-256 hash only
        user.setResetPasswordToken(hashToken(otp));
        // OTP expiry: 5 minutes
        user.setResetPasswordTokenExpiry(LocalDateTime.now().plusMinutes(5));
        user.setResetPasswordAttempts(0);
        user.setResetPasswordVerified(false);
        user.setLastResetPasswordRequestAt(LocalDateTime.now());
        userRepository.save(user);

        // Deliver OTP through email service (logs in dev terminal only, never returned in API response)
        if (emailService != null) {
            emailService.sendPasswordResetOtp(user.getEmail(), otp);
        }

        return "If an account is associated with this email, a 6-digit verification code has been sent.";
    }

    @Override
    public void verifyOtp(VerifyOtpRequest request) {
        if (request == null || request.getEmail() == null || request.getOtp() == null) {
            throw new RuntimeException("Email and verification code are required.");
        }

        String normalizedEmail = request.getEmail().trim();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .or(() -> userRepository.findByEmail(normalizedEmail))
                .orElseThrow(() -> new RuntimeException("Invalid or unrecognized password reset request."));

        if (user.getResetPasswordToken() == null) {
            throw new RuntimeException("No active password reset request found. Please request a new code.");
        }

        // Check verification attempts (max 5)
        int currentAttempts = user.getResetPasswordAttempts() != null ? user.getResetPasswordAttempts() : 0;
        if (currentAttempts >= 5) {
            user.setResetPasswordToken(null);
            user.setResetPasswordTokenExpiry(null);
            user.setResetPasswordAttempts(0);
            user.setResetPasswordVerified(false);
            userRepository.save(user);
            throw new RuntimeException("Too many incorrect attempts. For security, your reset code has been invalidated. Please request a new code.");
        }

        // Check expiry (5 minutes)
        if (user.getResetPasswordTokenExpiry() == null ||
                user.getResetPasswordTokenExpiry().isBefore(LocalDateTime.now())) {
            user.setResetPasswordToken(null);
            user.setResetPasswordTokenExpiry(null);
            user.setResetPasswordAttempts(0);
            user.setResetPasswordVerified(false);
            userRepository.save(user);
            throw new RuntimeException("Verification code has expired (valid for 5 minutes). Please request a new code.");
        }

        // Check hash
        String inputHash = hashToken(request.getOtp().trim());
        if (!inputHash.equals(user.getResetPasswordToken())) {
            int newAttempts = currentAttempts + 1;
            user.setResetPasswordAttempts(newAttempts);
            userRepository.save(user);
            int remaining = 5 - newAttempts;
            if (remaining > 0) {
                throw new RuntimeException("Invalid verification code. " + remaining + " attempt(s) remaining.");
            } else {
                user.setResetPasswordToken(null);
                user.setResetPasswordTokenExpiry(null);
                user.setResetPasswordAttempts(0);
                user.setResetPasswordVerified(false);
                userRepository.save(user);
                throw new RuntimeException("Too many incorrect attempts. Please request a new code.");
            }
        }

        // OTP is verified
        user.setResetPasswordVerified(true);
        user.setResetPasswordAttempts(0);
        userRepository.save(user);
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        if (request == null || request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new RuntimeException("New password is required.");
        }

        if (request.getNewPassword().length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters long.");
        }

        User user = null;
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String normalizedEmail = request.getEmail().trim();
            user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                    .or(() -> userRepository.findByEmail(normalizedEmail))
                    .orElse(null);
        }

        if (user == null && request.getToken() != null && !request.getToken().isBlank()) {
            String tokenHash = hashToken(request.getToken().trim());
            user = userRepository.findByResetPasswordToken(tokenHash).orElse(null);
        }

        if (user == null) {
            throw new RuntimeException("Invalid or unrecognized password reset session.");
        }

        // Check if verified or token matches
        boolean isVerified = Boolean.TRUE.equals(user.getResetPasswordVerified());
        boolean isTokenValid = false;
        if (request.getToken() != null && !request.getToken().isBlank()) {
            String tokenHash = hashToken(request.getToken().trim());
            if (tokenHash.equals(user.getResetPasswordToken())) {
                isTokenValid = true;
            }
        }

        if (!isVerified && !isTokenValid) {
            throw new RuntimeException("Verification code has not been validated. Please verify your OTP before resetting password.");
        }

        if (user.getResetPasswordTokenExpiry() == null ||
                user.getResetPasswordTokenExpiry().isBefore(LocalDateTime.now())) {
            user.setResetPasswordToken(null);
            user.setResetPasswordTokenExpiry(null);
            user.setResetPasswordVerified(false);
            userRepository.save(user);
            throw new RuntimeException("Reset session has expired. Please request a new verification code.");
        }

        // Update password with existing PasswordEncoder
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));

        // Invalidate token, expiry and verification state (cannot be reused)
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);
        user.setResetPasswordAttempts(0);
        user.setResetPasswordVerified(false);
        userRepository.save(user);
    }

    private String hashToken(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.trim().getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error hashing reset token", e);
        }
    }

}
