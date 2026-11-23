package com.ayursutra.backend;

import com.ayursutra.constant.Role;
import com.ayursutra.constant.VerificationStatus;
import com.ayursutra.dto.request.ForgotPasswordRequest;
import com.ayursutra.dto.request.LoginRequest;
import com.ayursutra.dto.request.ResetPasswordRequest;
import com.ayursutra.dto.request.VerifyOtpRequest;
import com.ayursutra.dto.response.LoginResponse;
import com.ayursutra.entity.User;
import com.ayursutra.repository.UserRepository;
import com.ayursutra.security.JwtService;
import com.ayursutra.service.EmailService;
import com.ayursutra.service.impl.AuthenticationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthPasswordResetTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    private AuthenticationServiceImpl authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        authService = new AuthenticationServiceImpl(
                authenticationManager,
                userRepository,
                jwtService,
                passwordEncoder,
                emailService
        );

        testUser = new User();
        testUser.setId("user-1");
        testUser.setEmail("patient@ayursutra.com");
        testUser.setFullName("Rahul Sharma");
        testUser.setPassword("encoded_old_password");
        testUser.setRole(Role.PATIENT);
        testUser.setEnabled(true);
        testUser.setVerificationStatus(VerificationStatus.APPROVED);
    }

    @Test
    @DisplayName("Request OTP: Non-existent email returns generic message without enumeration")
    void testForgotPassword_NonExistentEmail_ReturnsGenericMessage() {
        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("nonexistent@ayursutra.com");

        when(userRepository.findByEmailIgnoreCase("nonexistent@ayursutra.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("nonexistent@ayursutra.com")).thenReturn(Optional.empty());

        String result = authService.forgotPassword(req);

        assertNotNull(result);
        assertTrue(result.contains("If an account is associated with this email"));
        verify(emailService, never()).sendPasswordResetOtp(anyString(), anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Request OTP: Valid email generates 6-digit OTP, stores SHA-256 hash, and sends via emailService")
    void testForgotPassword_ValidEmail_GeneratesHashAndDispatches() {
        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("PATIENT@ayursutra.com");

        when(userRepository.findByEmailIgnoreCase("PATIENT@ayursutra.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        String result = authService.forgotPassword(req);

        assertNotNull(result);
        assertTrue(result.contains("If an account is associated with this email"));

        // Capture OTP sent to email service
        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendPasswordResetOtp(eq("patient@ayursutra.com"), otpCaptor.capture());
        String dispatchedOtp = otpCaptor.getValue();
        assertNotNull(dispatchedOtp);
        assertEquals(6, dispatchedOtp.length());
        assertTrue(dispatchedOtp.matches("\\d{6}"));

        // Verify user state: Token stored must be a SHA-256 hash (64 hex characters), not plain OTP
        assertNotNull(testUser.getResetPasswordToken());
        assertEquals(64, testUser.getResetPasswordToken().length());
        assertNotEquals(dispatchedOtp, testUser.getResetPasswordToken());
        assertNotNull(testUser.getResetPasswordTokenExpiry());
        assertTrue(testUser.getResetPasswordTokenExpiry().isAfter(LocalDateTime.now()));
        assertEquals(0, testUser.getResetPasswordAttempts());
        assertFalse(testUser.getResetPasswordVerified());
    }

    @Test
    @DisplayName("Request OTP: Resend within 60 seconds triggers cooldown rate-limit exception")
    void testForgotPassword_ResendCooldownEnforced() {
        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("patient@ayursutra.com");

        testUser.setLastResetPasswordRequestAt(LocalDateTime.now().minusSeconds(20)); // only 20s ago
        when(userRepository.findByEmailIgnoreCase("patient@ayursutra.com")).thenReturn(Optional.of(testUser));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.forgotPassword(req));
        assertTrue(ex.getMessage().contains("Please wait") && ex.getMessage().contains("seconds"));
        verify(emailService, never()).sendPasswordResetOtp(anyString(), anyString());
    }

    @Test
    @DisplayName("Verify OTP: Incorrect OTP increments attempt counter and throws error")
    void testVerifyOtp_IncorrectCode_IncrementsAttempts() {
        // Prepare user with valid OTP hash
        ForgotPasswordRequest forgotReq = new ForgotPasswordRequest();
        forgotReq.setEmail("patient@ayursutra.com");
        when(userRepository.findByEmailIgnoreCase("patient@ayursutra.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        authService.forgotPassword(forgotReq);

        VerifyOtpRequest verifyReq = VerifyOtpRequest.builder()
                .email("patient@ayursutra.com")
                .otp("000000") // Wrong OTP
                .build();

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.verifyOtp(verifyReq));
        assertTrue(ex.getMessage().contains("Invalid verification code"));
        assertEquals(1, testUser.getResetPasswordAttempts());
        assertFalse(testUser.getResetPasswordVerified());
    }

    @Test
    @DisplayName("Verify OTP: 5 incorrect attempts locks out and clears OTP token")
    void testVerifyOtp_MaxAttemptsLockout() {
        ForgotPasswordRequest forgotReq = new ForgotPasswordRequest();
        forgotReq.setEmail("patient@ayursutra.com");
        when(userRepository.findByEmailIgnoreCase("patient@ayursutra.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        authService.forgotPassword(forgotReq);

        testUser.setResetPasswordAttempts(4); // 4 attempts already made

        VerifyOtpRequest verifyReq = VerifyOtpRequest.builder()
                .email("patient@ayursutra.com")
                .otp("999999")
                .build();

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.verifyOtp(verifyReq));
        assertTrue(ex.getMessage().contains("Too many incorrect attempts"));
        assertNull(testUser.getResetPasswordToken());
        assertNull(testUser.getResetPasswordTokenExpiry());
    }

    @Test
    @DisplayName("Verify OTP: Expired OTP throws error and invalidates token")
    void testVerifyOtp_ExpiredOtp() {
        ForgotPasswordRequest forgotReq = new ForgotPasswordRequest();
        forgotReq.setEmail("patient@ayursutra.com");
        when(userRepository.findByEmailIgnoreCase("patient@ayursutra.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        authService.forgotPassword(forgotReq);

        // Simulate expiration (e.g. 6 minutes ago)
        testUser.setResetPasswordTokenExpiry(LocalDateTime.now().minusMinutes(1));

        VerifyOtpRequest verifyReq = VerifyOtpRequest.builder()
                .email("patient@ayursutra.com")
                .otp("123456")
                .build();

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.verifyOtp(verifyReq));
        assertTrue(ex.getMessage().contains("expired"));
        assertNull(testUser.getResetPasswordToken());
    }

    @Test
    @DisplayName("Full Flow: Request OTP -> Verify Correct OTP -> Reset Password with PasswordEncoder -> Clean Token")
    void testFullPasswordResetFlow_Success() {
        // Step 1: Request OTP
        ForgotPasswordRequest forgotReq = new ForgotPasswordRequest();
        forgotReq.setEmail("patient@ayursutra.com");
        when(userRepository.findByEmailIgnoreCase("patient@ayursutra.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        authService.forgotPassword(forgotReq);

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendPasswordResetOtp(eq("patient@ayursutra.com"), otpCaptor.capture());
        String generatedOtp = otpCaptor.getValue();

        // Step 2: Verify OTP
        VerifyOtpRequest verifyReq = VerifyOtpRequest.builder()
                .email("patient@ayursutra.com")
                .otp(generatedOtp)
                .build();

        authService.verifyOtp(verifyReq);
        assertTrue(testUser.getResetPasswordVerified());

        // Step 3: Reset Password
        when(passwordEncoder.encode("NewSecurePassword123!")).thenReturn("encoded_new_password_hash");

        ResetPasswordRequest resetReq = ResetPasswordRequest.builder()
                .email("patient@ayursutra.com")
                .token(generatedOtp)
                .newPassword("NewSecurePassword123!")
                .build();

        authService.resetPassword(resetReq);

        // Verify password updated and reset session completely invalidated
        assertEquals("encoded_new_password_hash", testUser.getPassword());
        assertNull(testUser.getResetPasswordToken());
        assertNull(testUser.getResetPasswordTokenExpiry());
        assertFalse(testUser.getResetPasswordVerified());

        // Step 4: Token cannot be reused
        ResetPasswordRequest reuseReq = ResetPasswordRequest.builder()
                .email("patient@ayursutra.com")
                .token(generatedOtp)
                .newPassword("AnotherPassword999!")
                .build();

        assertThrows(RuntimeException.class, () -> authService.resetPassword(reuseReq));
    }

    @Test
    @DisplayName("Login Flow: Case-insensitive email matches and succeeds with JWT; deactivated/suspended accounts are blocked")
    void testLoginFlow() {
        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail("PATIENT@ayursutra.com");
        loginReq.setPassword("Password123");

        when(userRepository.findByEmailIgnoreCase("PATIENT@ayursutra.com")).thenReturn(Optional.of(testUser));
        when(jwtService.generateToken("patient@ayursutra.com")).thenReturn("mocked-jwt-token");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        LoginResponse response = authService.login(loginReq);

        assertNotNull(response);
        assertEquals("mocked-jwt-token", response.getToken());
        assertEquals("Rahul Sharma", response.getFullName());
        assertEquals("PATIENT", response.getRole());
        verify(authenticationManager).authenticate(any());

        // Deactivated user is blocked
        testUser.setEnabled(false);
        assertThrows(org.springframework.security.authentication.DisabledException.class, () -> authService.login(loginReq));
    }

}
