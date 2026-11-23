package com.ayursutra.backend;

import com.ayursutra.constant.Role;
import com.ayursutra.constant.VerificationStatus;
import com.ayursutra.dto.request.DoctorRequest;
import com.ayursutra.dto.request.TherapistRequest;
import com.ayursutra.dto.response.DoctorResponse;
import com.ayursutra.dto.response.ReceptionistResponse;
import com.ayursutra.dto.response.TherapistResponse;
import com.ayursutra.entity.Doctor;
import com.ayursutra.entity.Receptionist;
import com.ayursutra.entity.Therapist;
import com.ayursutra.entity.User;
import com.ayursutra.mapper.DoctorMapper;
import com.ayursutra.mapper.ReceptionistMapper;
import com.ayursutra.mapper.TherapistMapper;
import com.ayursutra.repository.DoctorRepository;
import com.ayursutra.repository.ReceptionistRepository;
import com.ayursutra.repository.TherapistRepository;
import com.ayursutra.repository.UserRepository;
import com.ayursutra.service.impl.DoctorServiceImpl;
import com.ayursutra.service.impl.ReceptionistServiceImpl;
import com.ayursutra.service.impl.TherapistServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ExistingApisPreservationTest {

    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private TherapistRepository therapistRepository;
    @Mock
    private ReceptionistRepository receptionistRepository;
    @Mock
    private UserRepository userRepository;

    private DoctorMapper doctorMapper;
    private TherapistMapper therapistMapper;
    private ReceptionistMapper receptionistMapper;

    private DoctorServiceImpl doctorService;
    private TherapistServiceImpl therapistService;
    private ReceptionistServiceImpl receptionistService;

    @BeforeEach
    void setUp() {
        doctorMapper = new DoctorMapper();
        therapistMapper = new TherapistMapper();
        receptionistMapper = new ReceptionistMapper();

        doctorService = new DoctorServiceImpl(doctorRepository, userRepository, doctorMapper);
        therapistService = new TherapistServiceImpl(therapistRepository, therapistMapper, null, null, userRepository);
        receptionistService = new ReceptionistServiceImpl(receptionistRepository, userRepository, receptionistMapper);
    }

    @Test
    @DisplayName("Existing Doctor APIs (getAll, getById, create) operate without regression")
    void testExistingDoctorApis() {
        Doctor doctor = new Doctor();
        doctor.setId("doc-1");
        doctor.setFullName("Dr. Existing");
        doctor.setLicenseNumber("LIC-123");
        doctor.setSpecialization("Kayachikitsa");

        when(doctorRepository.findAll()).thenReturn(List.of(doctor));
        when(doctorRepository.findById("doc-1")).thenReturn(Optional.of(doctor));
        when(doctorRepository.existsByLicenseNumber("LIC-NEW")).thenReturn(false);
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(inv -> inv.getArgument(0));

        // getAllDoctors
        List<DoctorResponse> all = doctorService.getAllDoctors();
        assertEquals(1, all.size());
        assertEquals("Dr. Existing", all.get(0).getFullName());

        // getDoctorById
        DoctorResponse single = doctorService.getDoctorById("doc-1");
        assertNotNull(single);
        assertEquals("LIC-123", single.getLicenseNumber());

        // createDoctor
        DoctorRequest createReq = new DoctorRequest();
        createReq.setFullName("Dr. Created");
        createReq.setLicenseNumber("LIC-NEW");
        DoctorResponse created = doctorService.createDoctor(createReq);
        assertNotNull(created);
        assertEquals("Dr. Created", created.getFullName());
    }

    @Test
    @DisplayName("Existing Therapist APIs (getAll, getById) operate without regression")
    void testExistingTherapistApis() {
        Therapist therapist = new Therapist();
        therapist.setId("ther-1");
        therapist.setFullName("Therapist Existing");
        therapist.setSpecialization("Panchakarma");

        when(therapistRepository.findAll()).thenReturn(List.of(therapist));
        when(therapistRepository.findById("ther-1")).thenReturn(Optional.of(therapist));

        List<TherapistResponse> all = therapistService.getAllTherapists();
        assertEquals(1, all.size());

        TherapistResponse single = therapistService.getTherapistById("ther-1");
        assertEquals("Therapist Existing", single.getFullName());
    }

    @Test
    @DisplayName("Receptionist APIs (getAll, getById) operate without regression")
    void testExistingReceptionistApis() {
        Receptionist rec = new Receptionist();
        rec.setId("rec-1");
        rec.setUserId("user-rec-1");
        rec.setFullName("Receptionist Existing");

        User user = new User();
        user.setId("user-rec-1");
        user.setGender("Female");

        when(receptionistRepository.findAll()).thenReturn(List.of(rec));
        when(receptionistRepository.findById("rec-1")).thenReturn(Optional.of(rec));
        when(userRepository.findById("user-rec-1")).thenReturn(Optional.of(user));

        List<ReceptionistResponse> all = receptionistService.getAllReceptionists();
        assertEquals(1, all.size());
        assertEquals("Female", all.get(0).getGender());

        ReceptionistResponse single = receptionistService.getReceptionistById("rec-1");
        assertEquals("Receptionist Existing", single.getFullName());
    }
}
