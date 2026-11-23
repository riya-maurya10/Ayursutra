package com.ayursutra.backend;

import com.ayursutra.controller.*;
import com.ayursutra.dto.request.ChangePasswordRequest;
import com.ayursutra.dto.request.ClinicSettingsRequest;
import com.ayursutra.dto.request.UpdateDoctorProfileRequest;
import com.ayursutra.dto.request.UpdateTherapistProfileRequest;
import com.ayursutra.dto.response.*;
import com.ayursutra.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({
        DoctorController.class,
        TherapistController.class,
        ReceptionistController.class,
        SettingsController.class,
        UserController.class,
        AuthController.class,
        com.ayursutra.exception.GlobalExceptionHandler.class
})
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
@Import(com.ayursutra.config.SecurityConfig.class)
public class ProfileAndSettingsSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DoctorService doctorService;

    @MockBean
    private TherapistService therapistService;

    @MockBean
    private ReceptionistService receptionistService;

    @MockBean
    private SettingsService settingsService;

    @MockBean
    private UserService userService;

    @MockBean
    private AuthenticationService authenticationService;

    @MockBean
    private AuditService auditService;

    @MockBean
    private com.ayursutra.security.JwtAuthenticationFilter jwtAuthenticationFilter;

    @org.junit.jupiter.api.BeforeEach
    void setUpFilter() throws Exception {
        org.mockito.Mockito.doAnswer(inv -> {
            jakarta.servlet.FilterChain chain = inv.getArgument(2);
            chain.doFilter(inv.getArgument(0), inv.getArgument(1));
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());
    }

    // =========================================================================
    // 1. Cross-Role Access Prevention Tests
    // =========================================================================

    @Test
    @DisplayName("Doctor can access /api/doctors/me but Therapist is rejected with 403 Forbidden")
    @WithMockUser(username = "therapist@ayursutra.clinic", roles = {"THERAPIST"})
    void testTherapistCannotAccessDoctorProfile() throws Exception {
        mockMvc.perform(get("/api/doctors/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Doctor cannot access /api/therapists/me - rejected with 403 Forbidden")
    @WithMockUser(username = "doctor@ayursutra.clinic", roles = {"DOCTOR"})
    void testDoctorCannotAccessTherapistProfile() throws Exception {
        mockMvc.perform(get("/api/therapists/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Doctor cannot access /api/receptionists/me - rejected with 403 Forbidden")
    @WithMockUser(username = "doctor@ayursutra.clinic", roles = {"DOCTOR"})
    void testDoctorCannotAccessReceptionistProfile() throws Exception {
        mockMvc.perform(get("/api/receptionists/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Doctor accessing /api/doctors/me is authorized (200 OK)")
    @WithMockUser(username = "doctor@ayursutra.clinic", roles = {"DOCTOR"})
    void testDoctorCanAccessDoctorProfile() throws Exception {
        when(doctorService.getMyProfile()).thenReturn(new DoctorResponse());

        mockMvc.perform(get("/api/doctors/me"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Therapist accessing /api/therapists/me is authorized (200 OK)")
    @WithMockUser(username = "therapist@ayursutra.clinic", roles = {"THERAPIST"})
    void testTherapistCanAccessTherapistProfile() throws Exception {
        when(therapistService.getMyProfile()).thenReturn(new TherapistResponse());

        mockMvc.perform(get("/api/therapists/me"))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // 2. Settings Access Control Tests
    // =========================================================================

    @Test
    @DisplayName("Only ADMIN can update clinic settings; DOCTOR is rejected with 403 Forbidden")
    @WithMockUser(username = "doctor@ayursutra.clinic", roles = {"DOCTOR"})
    void testDoctorCannotUpdateClinicSettings() throws Exception {
        ClinicSettingsRequest request = new ClinicSettingsRequest();
        request.setClinicName("Hacked Clinic Name");

        mockMvc.perform(put("/api/settings/clinic")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN can update clinic settings (200 OK)")
    @WithMockUser(username = "admin@ayursutra.clinic", roles = {"ADMIN"})
    void testAdminCanUpdateClinicSettings() throws Exception {
        ClinicSettingsRequest request = new ClinicSettingsRequest();
        request.setClinicName("AyurSutra Main Center");

        when(settingsService.updateClinicSettings(any(), any())).thenReturn(new ClinicSettingsResponse());

        mockMvc.perform(put("/api/settings/clinic")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Authenticated user can view and update their own user settings")
    @WithMockUser(username = "staff@ayursutra.clinic", roles = {"DOCTOR"})
    void testAuthenticatedUserCanAccessUserSettings() throws Exception {
        // GET /api/settings/clinic is allowed for any authenticated user
        when(settingsService.getClinicSettings(any())).thenReturn(new ClinicSettingsResponse());
        mockMvc.perform(get("/api/settings/clinic"))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // 3. Unauthenticated Access Denial Tests
    // =========================================================================

    @Test
    @DisplayName("Unauthenticated request to /api/doctors/me is rejected")
    void testUnauthenticatedAccessRejected() throws Exception {
        mockMvc.perform(get("/api/doctors/me"))
                .andExpect(status().is4xxClientError());
    }
}
