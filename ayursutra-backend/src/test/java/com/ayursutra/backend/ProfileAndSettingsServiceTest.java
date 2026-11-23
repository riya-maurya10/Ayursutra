package com.ayursutra.backend;

import com.ayursutra.constant.Role;
import com.ayursutra.constant.VerificationStatus;
import com.ayursutra.dto.request.*;
import com.ayursutra.dto.response.*;
import com.ayursutra.entity.*;
import com.ayursutra.mapper.*;
import com.ayursutra.repository.*;
import com.ayursutra.security.JwtService;
import com.ayursutra.security.UserPrincipal;
import com.ayursutra.service.impl.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProfileAndSettingsServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private TherapistRepository therapistRepository;
    @Mock
    private ReceptionistRepository receptionistRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private ClinicSettingsRepository clinicSettingsRepository;
    @Mock
    private UserSettingsRepository userSettingsRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtService jwtService;
    @Mock
    private SecurityContext securityContext;
    @Mock
    private Authentication authentication;
    @Mock
    private com.ayursutra.service.NotificationService notificationService;

    private UserMapper userMapper;
    private DoctorMapper doctorMapper;
    private TherapistMapper therapistMapper;
    private ReceptionistMapper receptionistMapper;
    private PatientMapper patientMapper;

    private UserServiceImpl userService;
    private DoctorServiceImpl doctorService;
    private TherapistServiceImpl therapistService;
    private ReceptionistServiceImpl receptionistService;
    private PatientServiceImpl patientService;
    private SettingsServiceImpl settingsService;
    private AuthenticationServiceImpl authenticationService;

    @BeforeEach
    void setUp() {
        userMapper = new UserMapper();
        doctorMapper = new DoctorMapper();
        therapistMapper = new TherapistMapper();
        receptionistMapper = new ReceptionistMapper();
        patientMapper = new PatientMapper();

        userService = new UserServiceImpl(
                userRepository,
                userMapper,
                passwordEncoder,
                doctorRepository,
                therapistRepository,
                receptionistRepository,
                patientRepository,
                notificationService
        );

        doctorService = new DoctorServiceImpl(
                doctorRepository,
                userRepository,
                doctorMapper
        );

        therapistService = new TherapistServiceImpl(
                therapistRepository,
                therapistMapper,
                null,
                patientRepository,
                userRepository
        );

        receptionistService = new ReceptionistServiceImpl(
                receptionistRepository,
                userRepository,
                receptionistMapper
        );

        patientService = new PatientServiceImpl(
                patientRepository,
                patientMapper,
                userRepository,
                notificationService
        );

        settingsService = new SettingsServiceImpl(
                clinicSettingsRepository,
                userSettingsRepository
        );

        authenticationService = new AuthenticationServiceImpl(
                authenticationManager,
                userRepository,
                jwtService,
                passwordEncoder
        );
    }

    private void mockSecurityContext(User user) {
        UserPrincipal principal = new UserPrincipal(user);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(principal);
        SecurityContextHolder.setContext(securityContext);
    }

    // =========================================================================
    // 1. ADMIN Profile Tests & Protected Fields Immutability
    // =========================================================================

    @Test
    @DisplayName("Admin profile GET and PUT updates personal info and preserves protected fields")
    void testAdminProfileGetAndPut() {
        User adminUser = new User();
        adminUser.setId("admin-001");
        adminUser.setFullName("Admin Root");
        adminUser.setEmail("admin@ayursutra.clinic");
        adminUser.setPhone("9999999999");
        adminUser.setRole(Role.ADMIN);
        adminUser.setEnabled(true);
        adminUser.setVerificationStatus(VerificationStatus.APPROVED);

        mockSecurityContext(adminUser);
        when(userRepository.findById("admin-001")).thenReturn(Optional.of(adminUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // GET Profile
        UserResponse getRes = userService.getMyProfile();
        assertNotNull(getRes);
        assertEquals("Admin Root", getRes.getFullName());
        assertEquals(Role.ADMIN, getRes.getRole());

        // PUT Profile (attempting to update phone, gender, address)
        UpdateUserProfileRequest updateReq = new UpdateUserProfileRequest();
        updateReq.setFullName("Super Admin");
        updateReq.setPhone("8888888888");
        updateReq.setGender("Male");
        updateReq.setAddress("Clinic HQ, Floor 4");
        updateReq.setBloodGroup("O+");
        updateReq.setDateOfBirth(LocalDate.of(1985, 5, 20));

        UserResponse putRes = userService.updateMyProfile(updateReq);

        assertEquals("Super Admin", putRes.getFullName());
        assertEquals("8888888888", putRes.getPhone());
        assertEquals("Male", putRes.getGender());
        assertEquals("Clinic HQ, Floor 4", putRes.getAddress());

        // Verify protected fields remained completely unchanged
        assertEquals(Role.ADMIN, putRes.getRole(), "Role must remain ADMIN");
        assertEquals("admin@ayursutra.clinic", putRes.getEmail(), "Email must remain unchanged");
        assertTrue(putRes.isEnabled(), "Enabled status must remain true");
        assertEquals(VerificationStatus.APPROVED, putRes.getVerificationStatus(), "VerificationStatus must remain APPROVED");
    }

    // =========================================================================
    // 2. DOCTOR Profile Tests & Entity Synchronization
    // =========================================================================

    @Test
    @DisplayName("Doctor profile GET and PUT updates doctor entity and synchronizes User base fields")
    void testDoctorProfileGetAndPutAndSync() {
        User docUser = new User();
        docUser.setId("doc-user-01");
        docUser.setFullName("Dr. Vanshika Gupta");
        docUser.setEmail("dr.vanshika@ayursutra.clinic");
        docUser.setPhone("8470897489");
        docUser.setRole(Role.DOCTOR);
        docUser.setEnabled(true);

        Doctor doctor = new Doctor();
        doctor.setId("doc-rec-01");
        doctor.setUserId("doc-user-01");
        doctor.setFullName("Dr. Vanshika Gupta");
        doctor.setEmail("dr.vanshika@ayursutra.clinic");
        doctor.setPhone("8470897489");
        doctor.setSpecialization("Panchakarma & Kayachikitsa");
        doctor.setQualification("BAMS, MD");
        doctor.setExperienceYears(6);
        doctor.setLicenseNumber("AY-2020-89765");
        doctor.setAvailable(true);

        mockSecurityContext(docUser);
        when(userRepository.findById("doc-user-01")).thenReturn(Optional.of(docUser));
        when(doctorRepository.findByUserId("doc-user-01")).thenReturn(Optional.of(doctor));
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // GET Profile
        DoctorResponse getRes = doctorService.getMyProfile();
        assertNotNull(getRes);
        assertEquals("Dr. Vanshika Gupta", getRes.getFullName());
        assertEquals("Panchakarma & Kayachikitsa", getRes.getSpecialization());

        // PUT Profile
        UpdateDoctorProfileRequest updateReq = new UpdateDoctorProfileRequest();
        updateReq.setFullName("Dr. Vanshika G. Senior");
        updateReq.setPhone("8470897499");
        updateReq.setSpecialization("Advanced Panchakarma");
        updateReq.setQualification("BAMS, MD, PhD");
        updateReq.setExperienceYears(7);
        updateReq.setAddress("AyurSutra Main Wing");
        updateReq.setGender("Female");
        updateReq.setDateOfBirth(LocalDate.of(1992, 4, 15));
        updateReq.setAvailable(false);

        DoctorResponse putRes = doctorService.updateMyProfile(updateReq);

        // Verify Doctor entity was updated
        assertEquals("Dr. Vanshika G. Senior", putRes.getFullName());
        assertEquals("8470897499", putRes.getPhone());
        assertEquals("Advanced Panchakarma", putRes.getSpecialization());
        assertEquals(7, putRes.getExperienceYears());
        assertFalse(putRes.isAvailable());

        // Verify User entity was synchronized
        assertEquals("Dr. Vanshika G. Senior", docUser.getFullName(), "User.fullName must synchronize");
        assertEquals("8470897499", docUser.getPhone(), "User.phone must synchronize");
        assertEquals("Female", docUser.getGender(), "User.gender must synchronize");
        assertEquals("AyurSutra Main Wing", docUser.getAddress(), "User.address must synchronize");
        assertEquals(LocalDate.of(1992, 4, 15), docUser.getDateOfBirth());
    }

    // =========================================================================
    // 3. THERAPIST Profile Tests & Entity Synchronization
    // =========================================================================

    @Test
    @DisplayName("Therapist profile GET and PUT updates skills and synchronizes User base fields")
    void testTherapistProfileGetAndPutAndSync() {
        User therUser = new User();
        therUser.setId("ther-user-01");
        therUser.setFullName("Ramesh Sharma");
        therUser.setEmail("ramesh.therapist@ayursutra.clinic");
        therUser.setPhone("9812345670");
        therUser.setRole(Role.THERAPIST);
        therUser.setEnabled(true);

        Therapist therapist = new Therapist();
        therapist.setId("ther-rec-01");
        therapist.setUserId("ther-user-01");
        therapist.setFullName("Ramesh Sharma");
        therapist.setEmail("ramesh.therapist@ayursutra.clinic");
        therapist.setPhone("9812345670");
        therapist.setSpecialization("Abhyanga & Shirodhara");
        therapist.setTherapistType("SENIOR");
        therapist.setTherapySkills(List.of("Abhyanga", "Shirodhara"));
        therapist.setAvailable(true);

        mockSecurityContext(therUser);
        when(userRepository.findById("ther-user-01")).thenReturn(Optional.of(therUser));
        when(therapistRepository.findByUserId("ther-user-01")).thenReturn(Optional.of(therapist));
        when(therapistRepository.save(any(Therapist.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // GET Profile
        TherapistResponse getRes = therapistService.getMyProfile();
        assertNotNull(getRes);
        assertEquals("Ramesh Sharma", getRes.getFullName());

        // PUT Profile
        UpdateTherapistProfileRequest updateReq = new UpdateTherapistProfileRequest();
        updateReq.setFullName("Ramesh Kumar Sharma");
        updateReq.setPhone("9812345679");
        updateReq.setSpecialization("Panchakarma Expert");
        updateReq.setTherapySkills(List.of("Abhyanga", "Shirodhara", "Swedana", "Basti"));
        updateReq.setTrainingCertifications("National Ayurveda Therapy Certification");
        updateReq.setAddress("Staff Quarters Block B");
        updateReq.setGender("Male");
        updateReq.setDateOfBirth(LocalDate.of(1990, 8, 10));

        TherapistResponse putRes = therapistService.updateMyProfile(updateReq);

        assertEquals("Ramesh Kumar Sharma", putRes.getFullName());
        assertEquals("9812345679", putRes.getPhone());
        assertEquals(4, putRes.getTherapySkills().size());

        // Verify User synchronization
        assertEquals("Ramesh Kumar Sharma", therUser.getFullName());
        assertEquals("9812345679", therUser.getPhone());
        assertEquals("Staff Quarters Block B", therUser.getAddress());
        assertEquals("Male", therUser.getGender());
    }

    // =========================================================================
    // 4. RECEPTIONIST Profile Tests & Entity Synchronization
    // =========================================================================

    @Test
    @DisplayName("Receptionist profile GET and PUT updates receptionist entity and synchronizes User base fields")
    void testReceptionistProfileGetAndPutAndSync() {
        User recUser = new User();
        recUser.setId("rec-user-01");
        recUser.setFullName("Pooja Verma");
        recUser.setEmail("pooja.frontdesk@ayursutra.clinic");
        recUser.setPhone("9711223344");
        recUser.setRole(Role.RECEPTIONIST);
        recUser.setEnabled(true);

        Receptionist receptionist = new Receptionist();
        receptionist.setId("rec-doc-01");
        receptionist.setUserId("rec-user-01");
        receptionist.setFullName("Pooja Verma");
        receptionist.setEmail("pooja.frontdesk@ayursutra.clinic");
        receptionist.setPhone("9711223344");
        receptionist.setClinicId("CLINIC-MAIN");
        receptionist.setAvailable(true);

        mockSecurityContext(recUser);
        when(userRepository.findById("rec-user-01")).thenReturn(Optional.of(recUser));
        when(receptionistRepository.findByUserId("rec-user-01")).thenReturn(Optional.of(receptionist));
        when(receptionistRepository.save(any(Receptionist.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // GET Profile
        ReceptionistResponse getRes = receptionistService.getMyProfile();
        assertNotNull(getRes);
        assertEquals("Pooja Verma", getRes.getFullName());
        assertEquals("CLINIC-MAIN", getRes.getClinicId());

        // PUT Profile
        UpdateReceptionistProfileRequest updateReq = new UpdateReceptionistProfileRequest();
        updateReq.setFullName("Pooja Sharma");
        updateReq.setPhone("9711223355");
        updateReq.setAddress("Sector 18, Noida");
        updateReq.setGender("Female");
        updateReq.setDateOfBirth(LocalDate.of(1996, 12, 1));
        updateReq.setAvailable(true);

        ReceptionistResponse putRes = receptionistService.updateMyProfile(updateReq);

        assertEquals("Pooja Sharma", putRes.getFullName());
        assertEquals("9711223355", putRes.getPhone());
        assertEquals("Sector 18, Noida", putRes.getAddress());

        // Verify User synchronization
        assertEquals("Pooja Sharma", recUser.getFullName());
        assertEquals("9711223355", recUser.getPhone());
        assertEquals("Sector 18, Noida", recUser.getAddress());
        assertEquals("Female", recUser.getGender());
    }

    // =========================================================================
    // 5. PATIENT Profile Tests & Entity Synchronization
    // =========================================================================

    @Test
    @DisplayName("Patient profile GET and PUT updates medical history and synchronizes User base fields")
    void testPatientProfileGetAndPutAndSync() {
        User patUser = new User();
        patUser.setId("pat-user-01");
        patUser.setFullName("Anil Mehta");
        patUser.setEmail("anil.mehta@example.com");
        patUser.setPhone("9876501234");
        patUser.setRole(Role.PATIENT);
        patUser.setEnabled(true);

        Patient patient = new Patient();
        patient.setId("pat-rec-01");
        patient.setUserId("pat-user-01");
        patient.setFullName("Anil Mehta");
        patient.setEmail("anil.mehta@example.com");
        patient.setPhone("9876501234");
        patient.setPrimaryDosha("VATA");
        patient.setAddress("Delhi NCR");
        patient.setMedicalHistory("Mild hypertension");

        mockSecurityContext(patUser);
        when(patientRepository.findByUserId("pat-user-01")).thenReturn(Optional.of(patient));
        when(userRepository.findById("pat-user-01")).thenReturn(Optional.of(patUser));
        when(patientRepository.save(any(Patient.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // GET Profile
        PatientResponse getRes = patientService.getMyProfile();
        assertNotNull(getRes);
        assertEquals("Anil Mehta", getRes.getFullName());
        assertEquals("VATA", getRes.getPrimaryDosha());

        // PUT Profile
        UpdatePatientRequest updateReq = new UpdatePatientRequest();
        updateReq.setFullName("Anil K. Mehta");
        updateReq.setPhone("9876509999");
        updateReq.setAddress("Vasant Kunj, New Delhi");
        updateReq.setGender("Male");
        updateReq.setMedicalHistory("Mild hypertension, chronic lower back pain");

        PatientResponse putRes = patientService.updateMyProfile(updateReq);

        assertEquals("Anil K. Mehta", putRes.getFullName());
        assertEquals("9876509999", putRes.getPhone());
        assertEquals("Vasant Kunj, New Delhi", putRes.getAddress());
        assertEquals("Mild hypertension, chronic lower back pain", putRes.getMedicalHistory());

        // Verify User synchronization
        assertEquals("Anil K. Mehta", patUser.getFullName());
        assertEquals("9876509999", patUser.getPhone());
        assertEquals("Vasant Kunj, New Delhi", patUser.getAddress());
        assertEquals("Male", patUser.getGender());
    }

    // =========================================================================
    // 6. PASSWORD CHANGE Tests
    // =========================================================================

    @Test
    @DisplayName("Password change succeeds with valid credentials and updates encrypted password")
    void testPasswordChangeSuccess() {
        User user = new User();
        user.setEmail("user@ayursutra.clinic");
        user.setPassword("encodedOldPassword");

        when(userRepository.findByEmail("user@ayursutra.clinic")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("OldPassword@123", "encodedOldPassword")).thenReturn(true);
        when(passwordEncoder.matches("NewSecure@456", "encodedOldPassword")).thenReturn(false);
        when(passwordEncoder.encode("NewSecure@456")).thenReturn("encodedNewPassword");

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("OldPassword@123");
        request.setNewPassword("NewSecure@456");
        request.setConfirmPassword("NewSecure@456");

        authenticationService.changePassword(request, "user@ayursutra.clinic");

        assertEquals("encodedNewPassword", user.getPassword(), "User password must be replaced with newly encoded password");
        verify(userRepository, times(1)).save(user);
    }

    @Test
    @DisplayName("Password change fails when current password does not match")
    void testPasswordChangeIncorrectCurrentPassword() {
        User user = new User();
        user.setEmail("user@ayursutra.clinic");
        user.setPassword("encodedOldPassword");

        when(userRepository.findByEmail("user@ayursutra.clinic")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPassword", "encodedOldPassword")).thenReturn(false);

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("WrongPassword");
        request.setNewPassword("NewSecure@456");
        request.setConfirmPassword("NewSecure@456");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                authenticationService.changePassword(request, "user@ayursutra.clinic")
        );
        assertTrue(ex.getMessage().contains("Current password does not match"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Password change fails when new password and confirm password differ")
    void testPasswordChangeMismatchedConfirmation() {
        User user = new User();
        user.setEmail("user@ayursutra.clinic");
        user.setPassword("encodedOldPassword");

        when(userRepository.findByEmail("user@ayursutra.clinic")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("OldPassword@123", "encodedOldPassword")).thenReturn(true);

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("OldPassword@123");
        request.setNewPassword("NewSecure@456");
        request.setConfirmPassword("DifferentPassword@789");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                authenticationService.changePassword(request, "user@ayursutra.clinic")
        );
        assertTrue(ex.getMessage().contains("do not match"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Password change fails when new password is identical to current password")
    void testPasswordChangeSameAsCurrent() {
        User user = new User();
        user.setEmail("user@ayursutra.clinic");
        user.setPassword("encodedOldPassword");

        when(userRepository.findByEmail("user@ayursutra.clinic")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("SamePassword@123", "encodedOldPassword")).thenReturn(true);

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("SamePassword@123");
        request.setNewPassword("SamePassword@123");
        request.setConfirmPassword("SamePassword@123");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                authenticationService.changePassword(request, "user@ayursutra.clinic")
        );
        assertTrue(ex.getMessage().contains("cannot be the same as your current password"));
        verify(userRepository, never()).save(any());
    }

    // =========================================================================
    // 7. LOGIN & LAST LOGIN TIMESTAMP Tests
    // =========================================================================

    @Test
    @DisplayName("Login updates lastLogin timestamp on successful authentication")
    void testLoginUpdatesLastLogin() {
        User user = new User();
        user.setEmail("doctor@ayursutra.clinic");
        user.setPassword("encodedPass");
        user.setFullName("Dr. Doctor");
        user.setRole(Role.DOCTOR);
        user.setEnabled(true);
        user.setVerificationStatus(VerificationStatus.APPROVED);
        user.setLastLogin(null);

        when(userRepository.findByEmail("doctor@ayursutra.clinic")).thenReturn(Optional.of(user));
        when(jwtService.generateToken("doctor@ayursutra.clinic")).thenReturn("mock-jwt-token");

        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail("doctor@ayursutra.clinic");
        loginReq.setPassword("Password@123");

        LoginResponse response = authenticationService.login(loginReq);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getToken());
        assertNotNull(user.getLastLogin(), "User lastLogin must be recorded upon successful login");
        verify(userRepository, times(1)).save(user);
    }

    // =========================================================================
    // 8. CLINIC SETTINGS ISOLATION Tests
    // =========================================================================

    @Test
    @DisplayName("Clinic settings are isolated by clinicId and do not leak across clinics")
    void testClinicSettingsIsolation() {
        ClinicSettings clinicA = ClinicSettings.builder()
                .clinicId("CLINIC-MAIN")
                .clinicName("AyurSutra Main Clinic")
                .currency("INR")
                .taxRate(18.0)
                .build();

        ClinicSettings clinicB = ClinicSettings.builder()
                .clinicId("CLINIC-BRANCH-SOUTH")
                .clinicName("AyurSutra South Center")
                .currency("INR")
                .taxRate(12.0)
                .build();

        when(clinicSettingsRepository.findByClinicId("CLINIC-MAIN")).thenReturn(Optional.of(clinicA));
        when(clinicSettingsRepository.findByClinicId("CLINIC-BRANCH-SOUTH")).thenReturn(Optional.of(clinicB));
        when(clinicSettingsRepository.save(any(ClinicSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // GET clinic A
        ClinicSettingsResponse resA = settingsService.getClinicSettings("CLINIC-MAIN");
        assertEquals("AyurSutra Main Clinic", resA.getClinicName());
        assertEquals(18.0, resA.getTaxRate());

        // GET clinic B
        ClinicSettingsResponse resB = settingsService.getClinicSettings("CLINIC-BRANCH-SOUTH");
        assertEquals("AyurSutra South Center", resB.getClinicName());
        assertEquals(12.0, resB.getTaxRate());

        // Update clinic B only
        ClinicSettingsRequest updateReq = new ClinicSettingsRequest();
        updateReq.setClinicName("AyurSutra South Deluxe Wellness");
        updateReq.setTaxRate(5.0);

        ClinicSettingsResponse updatedB = settingsService.updateClinicSettings("CLINIC-BRANCH-SOUTH", updateReq);

        assertEquals("AyurSutra South Deluxe Wellness", updatedB.getClinicName());
        assertEquals(5.0, updatedB.getTaxRate());

        // Verify clinic A remains completely unchanged
        assertEquals("AyurSutra Main Clinic", clinicA.getClinicName());
        assertEquals(18.0, clinicA.getTaxRate());
    }

    // =========================================================================
    // 9. USER SETTINGS ISOLATION Tests
    // =========================================================================

    @Test
    @DisplayName("User settings are strictly isolated by userId and do not bleed across users")
    void testUserSettingsIsolation() {
        UserSettings userASettings = UserSettings.builder()
                .userId("user-001")
                .theme("dark")
                .language("hi")
                .emailNotifications(true)
                .build();

        UserSettings userBSettings = UserSettings.builder()
                .userId("user-002")
                .theme("light")
                .language("en")
                .emailNotifications(false)
                .build();

        when(userSettingsRepository.findByUserId("user-001")).thenReturn(Optional.of(userASettings));
        when(userSettingsRepository.findByUserId("user-002")).thenReturn(Optional.of(userBSettings));
        when(userSettingsRepository.save(any(UserSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Update User A settings
        UserSettingsRequest updateA = new UserSettingsRequest();
        updateA.setTheme("sepia");
        updateA.setLanguage("sa"); // Sanskrit

        UserSettingsResponse resA = settingsService.updateUserSettings("user-001", updateA);
        assertEquals("sepia", resA.getTheme());
        assertEquals("sa", resA.getLanguage());

        // Verify User B settings remained intact
        UserSettingsResponse resB = settingsService.getUserSettings("user-002");
        assertEquals("light", resB.getTheme());
        assertEquals("en", resB.getLanguage());
        assertFalse(resB.getEmailNotifications());
    }
}
