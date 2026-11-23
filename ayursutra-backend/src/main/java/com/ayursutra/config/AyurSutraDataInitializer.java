package com.ayursutra.config;

import com.ayursutra.constant.AppointmentStatus;
import com.ayursutra.constant.AppointmentType;
import com.ayursutra.constant.NotificationStatus;
import com.ayursutra.constant.NotificationType;
import com.ayursutra.constant.Role;
import com.ayursutra.entity.*;
import com.ayursutra.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AyurSutraDataInitializer implements CommandLineRunner {

    private final InventoryRepository inventoryRepository;
    private final BillingRepository billingRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final TherapistRepository therapistRepository;
    private final PatientMedicalRecordRepository medicalRecordRepository;
    private final DoctorClinicalNoteRepository clinicalNoteRepository;

    @Override
    public void run(String... args) {
        seedInventory();
        seedBilling();
        seedNotifications();
        seedAppointments();
        seedEMR();
    }

    private void seedInventory() {
        if (inventoryRepository.count() > 0) {
            return;
        }

        List<InventoryItem> items = List.of(
                new InventoryItem("Mahanarayana Taila", "MEDICATED_OIL", 4500.0, "ml", 1000.0, 1.25, "MN-2026-A", "2027-12-31", "Kottakkal Arya Vaidya Sala", "Pharmacy Rack A1"),
                new InventoryItem("Ksheerabala Taila 101", "MEDICATED_OIL", 2200.0, "ml", 500.0, 2.80, "KB-2026-B", "2027-10-31", "AVP Coimbatore", "Pharmacy Rack A2"),
                new InventoryItem("Dhanwantharam Taila", "MEDICATED_OIL", 3800.0, "ml", 1000.0, 1.40, "DW-2026-C", "2028-01-31", "Vaidyaratnam Oushadhasala", "Pharmacy Rack A1"),
                new InventoryItem("Anu Taila (Nasya Oil)", "MEDICATED_OIL", 650.0, "ml", 200.0, 3.50, "AT-2026-D", "2027-08-31", "Kottakkal Arya Vaidya Sala", "Pharmacy Cabinet C"),
                new InventoryItem("Brahmi Medicated Ghee", "GHEE", 2800.0, "gm", 600.0, 1.90, "BG-2026-E", "2027-06-30", "Baidyanath Ayurveda", "Cold Storage Rack"),
                new InventoryItem("Kolakulathadi Churna (Scrub)", "HERBAL_POWDER", 12.5, "kg", 3.0, 450.0, "KC-2026-F", "2028-03-31", "Nagarjuna Ayurvedic Group", "Dry Storage Rack B"),
                new InventoryItem("Dashamoola Kwatha Decoction", "KWATHA", 18.0, "litre", 4.0, 280.0, "DK-2026-G", "2027-04-30", "Kerala Ayurveda Ltd", "Pharmacy Rack B2"),
                new InventoryItem("Shirodhara Cotton Varti (Headbands)", "CONSUMABLE", 140.0, "pieces", 30.0, 25.0, "VB-2026-H", "2029-01-01", "AyurSutra Linen Works", "Linen Cabinet L1"),
                new InventoryItem("Organic Droni Therapy Sheets", "LINEN", 48.0, "pieces", 15.0, 350.0, "DS-2026-I", "2029-01-01", "AyurSutra Linen Works", "Linen Cabinet L2")
        );

        inventoryRepository.saveAll(items);
    }

    private void seedBilling() {
        if (billingRepository.count() > 0) {
            return;
        }

        List<BillingRecord> bills = List.of(
                new BillingRecord("AYUR-202611-1001", "P-DEMO-01", "Rahul Sharma", "+91 98765 43210", "7-Day Rejuvenation Panchakarma", "TP-DEMO-1", 18500.0, 1500.0, 850.0, 17850.0, 17850.0, 0.0, "PAID", "UPI", "UPI-REF-992144", LocalDate.now().minusDays(5), "Completed upfront payment for complete 7-day package."),
                new BillingRecord("AYUR-202611-1002", "P-DEMO-02", "Ananya Verma", "+91 98111 22334", "14-Day Chronic Joint & Spine Detox", "TP-DEMO-2", 34000.0, 2000.0, 1600.0, 33600.0, 20000.0, 13600.0, "PARTIALLY_PAID", "CARD", "TXN-88776655", LocalDate.now().minusDays(2), "Advance received. Balance due upon mid-treatment consultation."),
                new BillingRecord("AYUR-202611-1003", "P-DEMO-03", "Vikramaditya Iyer", "+91 94444 55667", "Classical Shirodhara & Abhyanga Session", "TP-DEMO-3", 4500.0, 0.0, 225.0, 4725.0, 0.0, 4725.0, "PENDING", "CASH", "", LocalDate.now(), "Pending post-session payment at reception counter.")
        );

        billingRepository.saveAll(bills);
    }

    private void seedNotifications() {
        if (notificationRepository.count() > 0) {
            return;
        }

        List<User> users = userRepository.findAll();
        if (users.isEmpty()) {
            return;
        }

        List<Notification> seedList = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (User user : users) {
            Role role = user.getRole();
            if (role == Role.ADMIN) {
                seedList.add(createNotification(user.getId(), "New Staff Registration Request", "Dr. Rajesh Sharma has submitted credentials for verification.", NotificationType.STAFF_REGISTRATION, NotificationStatus.UNREAD, "/admin/staff-verifications", now.minusMinutes(35)));
                seedList.add(createNotification(user.getId(), "Low Stock Alert: Mahanarayana Taila", "Mahanarayana Taila stock is nearing minimum threshold (1200 ml remaining).", NotificationType.INVENTORY_ALERT, NotificationStatus.UNREAD, "/admin/inventory", now.minusHours(2)));
                seedList.add(createNotification(user.getId(), "New Patient Registration", "Patient Ananya Verma was registered by reception.", NotificationType.PATIENT_REGISTRATION, NotificationStatus.UNREAD, "/admin/patients", now.minusHours(5)));
                seedList.add(createNotification(user.getId(), "Clinical Protocol Compliance", "Monthly NABH Panchakarma therapy safety audit report is ready for review.", NotificationType.CLINIC_ALERT, NotificationStatus.READ, "/admin/settings", now.minusDays(1)));
            } else if (role == Role.DOCTOR) {
                seedList.add(createNotification(user.getId(), "New Patient Assigned", "Patient Rahul Sharma has been assigned to your Panchakarma consultation schedule.", NotificationType.PATIENT_ASSIGNMENT, NotificationStatus.UNREAD, "/doctor/patients", now.minusMinutes(40)));
                seedList.add(createNotification(user.getId(), "Therapy Plan Update", "Therapist updated session notes for Shirodhara Day 3.", NotificationType.THERAPY_PLAN_UPDATE, NotificationStatus.UNREAD, "/doctor/sessions", now.minusHours(3)));
                seedList.add(createNotification(user.getId(), "Patient Vitals Recorded", "Pre-procedure vitals recorded for patient Priya Nair.", NotificationType.PATIENT_PROGRESS, NotificationStatus.READ, "/doctor/patients", now.minusDays(1)));
            } else if (role == Role.THERAPIST) {
                seedList.add(createNotification(user.getId(), "Upcoming Session: Abhyanga", "Therapy session with Rahul Sharma scheduled today at 10:30 AM in Room 2.", NotificationType.THERAPY_SCHEDULED, NotificationStatus.UNREAD, "/therapist/sessions", now.minusMinutes(25)));
                seedList.add(createNotification(user.getId(), "Therapy Checklist Reminder", "Please confirm herbal oil warming preparation for 2:00 PM Shirodhara session.", NotificationType.THERAPY_REMINDER, NotificationStatus.UNREAD, "/therapist/sessions", now.minusHours(1)));
                seedList.add(createNotification(user.getId(), "Session Completed", "Morning Swedana session marked complete for patient Ananya Verma.", NotificationType.THERAPY_COMPLETED, NotificationStatus.READ, "/therapist/sessions", now.minusDays(1)));
            } else if (role == Role.RECEPTIONIST) {
                seedList.add(createNotification(user.getId(), "Patient Check-in Alert", "Patient Vikramaditya Iyer has arrived for 11:00 AM consultation.", NotificationType.PATIENT_ARRIVAL, NotificationStatus.UNREAD, "/receptionist/patients", now.minusMinutes(15)));
                seedList.add(createNotification(user.getId(), "Pending Invoice Payment", "Invoice AYUR-202611-1003 for Vikramaditya Iyer is awaiting counter payment.", NotificationType.BILLING_UPDATE, NotificationStatus.UNREAD, "/receptionist/billing", now.minusHours(2)));
                seedList.add(createNotification(user.getId(), "New Appointment Booked", "Appointment confirmed for Dr. Rajesh Sharma tomorrow at 4:00 PM.", NotificationType.APPOINTMENT_BOOKED, NotificationStatus.READ, "/receptionist/appointments", now.minusDays(1)));
            } else if (role == Role.PATIENT) {
                seedList.add(createNotification(user.getId(), "Upcoming Therapy Session", "Your Shirodhara session is scheduled for tomorrow at 10:00 AM in Room 2.", NotificationType.THERAPY_SCHEDULED, NotificationStatus.UNREAD, "/patient/sessions", now.minusMinutes(50)));
                seedList.add(createNotification(user.getId(), "Dietary & Lifestyle Advice", "Dr. Rajesh updated your post-Panchakarma Pathya (diet) recommendations.", NotificationType.DIET_REMINDER, NotificationStatus.UNREAD, "/patient/diet", now.minusHours(4)));
                seedList.add(createNotification(user.getId(), "Medication Reminder", "Reminder: Take Brahmi Rasayana with warm milk after dinner.", NotificationType.MEDICINE_REMINDER, NotificationStatus.UNREAD, "/patient/prescriptions", now.minusHours(6)));
                seedList.add(createNotification(user.getId(), "Payment Receipt Available", "Invoice AYUR-202611-1001 for ₹17,850 has been marked PAID.", NotificationType.BILLING_UPDATE, NotificationStatus.READ, "/patient/billing", now.minusDays(2)));
            }
        }

        if (!seedList.isEmpty()) {
            notificationRepository.saveAll(seedList);
        }
    }

    private Notification createNotification(
            String recipientId,
            String title,
            String message,
            NotificationType type,
            NotificationStatus status,
            String link,
            LocalDateTime createdAt) {
        Notification n = new Notification();
        n.setRecipientId(recipientId);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type);
        n.setStatus(status);
        n.setLink(link);
        n.setCreatedAt(createdAt);
        if (status == NotificationStatus.READ) {
            n.setReadAt(createdAt.plusMinutes(10));
        }
        return n;
    }

    private void seedAppointments() {
        if (appointmentRepository.count() > 0) {
            return;
        }

        List<Doctor> doctors = doctorRepository.findAll();
        List<Patient> patients = patientRepository.findAll();
        List<Therapist> therapists = therapistRepository.findAll();

        if (doctors.isEmpty()) {
            return;
        }

        Doctor primaryDoc = doctors.get(0);
        Patient p1 = !patients.isEmpty() ? patients.get(0) : null;
        Patient p2 = patients.size() > 1 ? patients.get(1) : p1;
        Therapist th1 = !therapists.isEmpty() ? therapists.get(0) : null;

        LocalDate today = LocalDate.now();
        List<Appointment> list = new ArrayList<>();

        // 1. Confirmed today 10:00 AM
        list.add(Appointment.builder()
                .clinicId("CLINIC-MAIN")
                .patientId(p1 != null ? p1.getId() : "P-DEMO-01")
                .patientName(p1 != null ? p1.getFullName() : "Rahul Sharma")
                .patientEmail(p1 != null ? p1.getEmail() : "patient@ayursutra.com")
                .patientPhone(p1 != null ? p1.getPhone() : "+91 98765 43210")
                .doctorId(primaryDoc.getId())
                .doctorUserId(primaryDoc.getUserId())
                .doctorName(primaryDoc.getFullName())
                .doctorSpecialization(primaryDoc.getSpecialization())
                .therapistId(th1 != null ? th1.getId() : null)
                .therapistName(th1 != null ? th1.getFullName() : null)
                .appointmentType(AppointmentType.INITIAL_CONSULTATION)
                .appointmentDate(today)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .durationMinutes(30)
                .status(AppointmentStatus.CONFIRMED)
                .chiefComplaints("Chronic Lower Back Pain (Kati Shula), fatigue, insomnia")
                .notes("Recommended pre-procedure Vata balancing evaluation")
                .arrivalRecorded(true)
                .arrivalTime(LocalDateTime.of(today, LocalTime.of(9, 50)))
                .reminderSent(true)
                .bookedByRole(Role.PATIENT)
                .build());

        // 2. Confirmed today 11:30 AM
        list.add(Appointment.builder()
                .clinicId("CLINIC-MAIN")
                .patientId(p2 != null ? p2.getId() : "P-DEMO-02")
                .patientName(p2 != null ? p2.getFullName() : "Ananya Verma")
                .patientEmail(p2 != null ? p2.getEmail() : "ananya@ayursutra.com")
                .patientPhone(p2 != null ? p2.getPhone() : "+91 98111 22334")
                .doctorId(primaryDoc.getId())
                .doctorUserId(primaryDoc.getUserId())
                .doctorName(primaryDoc.getFullName())
                .doctorSpecialization(primaryDoc.getSpecialization())
                .appointmentType(AppointmentType.PANCHAKARMA_ASSESSMENT)
                .appointmentDate(today)
                .startTime(LocalTime.of(11, 30))
                .endTime(LocalTime.of(12, 0))
                .durationMinutes(30)
                .status(AppointmentStatus.CONFIRMED)
                .chiefComplaints("Digestive weakness (Agni Mandya), morning stiffness")
                .notes("Panchakarma detox cycle suitability check")
                .arrivalRecorded(false)
                .reminderSent(true)
                .bookedByRole(Role.RECEPTIONIST)
                .build());

        // 3. Pending today 02:00 PM
        list.add(Appointment.builder()
                .clinicId("CLINIC-MAIN")
                .patientId(p1 != null ? p1.getId() : "P-DEMO-01")
                .patientName(p1 != null ? p1.getFullName() : "Rahul Sharma")
                .patientEmail(p1 != null ? p1.getEmail() : "patient@ayursutra.com")
                .patientPhone(p1 != null ? p1.getPhone() : "+91 98765 43210")
                .doctorId(primaryDoc.getId())
                .doctorUserId(primaryDoc.getUserId())
                .doctorName(primaryDoc.getFullName())
                .doctorSpecialization(primaryDoc.getSpecialization())
                .appointmentType(AppointmentType.FOLLOW_UP)
                .appointmentDate(today)
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(14, 30))
                .durationMinutes(30)
                .status(AppointmentStatus.PENDING)
                .chiefComplaints("Post-therapy review following Day 2 Abhyanga")
                .notes("Awaiting doctor review")
                .arrivalRecorded(false)
                .reminderSent(false)
                .bookedByRole(Role.PATIENT)
                .build());

        // 4. Tomorrow 10:30 AM Confirmed
        list.add(Appointment.builder()
                .clinicId("CLINIC-MAIN")
                .patientId(p2 != null ? p2.getId() : "P-DEMO-02")
                .patientName(p2 != null ? p2.getFullName() : "Ananya Verma")
                .patientEmail(p2 != null ? p2.getEmail() : "ananya@ayursutra.com")
                .patientPhone(p2 != null ? p2.getPhone() : "+91 98111 22334")
                .doctorId(primaryDoc.getId())
                .doctorUserId(primaryDoc.getUserId())
                .doctorName(primaryDoc.getFullName())
                .doctorSpecialization(primaryDoc.getSpecialization())
                .appointmentType(AppointmentType.GENERAL_AYURVEDIC)
                .appointmentDate(today.plusDays(1))
                .startTime(LocalTime.of(10, 30))
                .endTime(LocalTime.of(11, 0))
                .durationMinutes(30)
                .status(AppointmentStatus.CONFIRMED)
                .chiefComplaints("Prakriti dosha lifestyle consultation")
                .notes("Scheduled at patient request")
                .arrivalRecorded(false)
                .reminderSent(false)
                .bookedByRole(Role.PATIENT)
                .build());

        // 5. Tomorrow 03:00 PM Rescheduled
        list.add(Appointment.builder()
                .clinicId("CLINIC-MAIN")
                .patientId(p1 != null ? p1.getId() : "P-DEMO-01")
                .patientName(p1 != null ? p1.getFullName() : "Rahul Sharma")
                .patientEmail(p1 != null ? p1.getEmail() : "patient@ayursutra.com")
                .patientPhone(p1 != null ? p1.getPhone() : "+91 98765 43210")
                .doctorId(primaryDoc.getId())
                .doctorUserId(primaryDoc.getUserId())
                .doctorName(primaryDoc.getFullName())
                .doctorSpecialization(primaryDoc.getSpecialization())
                .appointmentType(AppointmentType.DIET_LIFESTYLE_CONSULTATION)
                .appointmentDate(today.plusDays(1))
                .startTime(LocalTime.of(15, 0))
                .endTime(LocalTime.of(15, 30))
                .durationMinutes(30)
                .status(AppointmentStatus.RESCHEDULED)
                .chiefComplaints("Diet modification for Pitta-Kapha balance")
                .notes("Rescheduled: Patient requested afternoon slot due to travel")
                .arrivalRecorded(false)
                .reminderSent(false)
                .bookedByRole(Role.PATIENT)
                .build());

        // 6. Yesterday Completed
        list.add(Appointment.builder()
                .clinicId("CLINIC-MAIN")
                .patientId(p1 != null ? p1.getId() : "P-DEMO-01")
                .patientName(p1 != null ? p1.getFullName() : "Rahul Sharma")
                .patientEmail(p1 != null ? p1.getEmail() : "patient@ayursutra.com")
                .patientPhone(p1 != null ? p1.getPhone() : "+91 98765 43210")
                .doctorId(primaryDoc.getId())
                .doctorUserId(primaryDoc.getUserId())
                .doctorName(primaryDoc.getFullName())
                .doctorSpecialization(primaryDoc.getSpecialization())
                .appointmentType(AppointmentType.INITIAL_CONSULTATION)
                .appointmentDate(today.minusDays(1))
                .startTime(LocalTime.of(9, 30))
                .endTime(LocalTime.of(10, 0))
                .durationMinutes(30)
                .status(AppointmentStatus.COMPLETED)
                .chiefComplaints("Initial Panchakarma intake examination")
                .notes("Consultation completed. Prescribed 7-day Shirodhara plan.")
                .arrivalRecorded(true)
                .arrivalTime(LocalDateTime.of(today.minusDays(1), LocalTime.of(9, 20)))
                .reminderSent(true)
                .bookedByRole(Role.RECEPTIONIST)
                .build());

        // 7. Yesterday No-Show
        list.add(Appointment.builder()
                .clinicId("CLINIC-MAIN")
                .patientId("P-DEMO-03")
                .patientName("Vikramaditya Iyer")
                .patientEmail("vikram@ayursutra.com")
                .patientPhone("+91 94444 55667")
                .doctorId(primaryDoc.getId())
                .doctorUserId(primaryDoc.getUserId())
                .doctorName(primaryDoc.getFullName())
                .doctorSpecialization(primaryDoc.getSpecialization())
                .appointmentType(AppointmentType.FOLLOW_UP)
                .appointmentDate(today.minusDays(1))
                .startTime(LocalTime.of(16, 0))
                .endTime(LocalTime.of(16, 30))
                .durationMinutes(30)
                .status(AppointmentStatus.NO_SHOW)
                .chiefComplaints("Routine follow-up checkup")
                .notes("Patient did not arrive. No response to reminder.")
                .arrivalRecorded(false)
                .reminderSent(true)
                .missedReminderSent(true)
                .bookedByRole(Role.RECEPTIONIST)
                .build());

        // 8. 3 days ago Cancelled
        list.add(Appointment.builder()
                .clinicId("CLINIC-MAIN")
                .patientId("P-DEMO-04")
                .patientName("Priya Nair")
                .patientEmail("priya@ayursutra.com")
                .patientPhone("+91 98888 77665")
                .doctorId(primaryDoc.getId())
                .doctorUserId(primaryDoc.getUserId())
                .doctorName(primaryDoc.getFullName())
                .doctorSpecialization(primaryDoc.getSpecialization())
                .appointmentType(AppointmentType.WELLNESS_CHECKUP)
                .appointmentDate(today.minusDays(3))
                .startTime(LocalTime.of(11, 0))
                .endTime(LocalTime.of(11, 30))
                .durationMinutes(30)
                .status(AppointmentStatus.CANCELLED)
                .chiefComplaints("Annual Ayurvedic wellness assessment")
                .cancellationReason("Patient had an urgent business commitment.")
                .arrivalRecorded(false)
                .reminderSent(false)
                .bookedByRole(Role.PATIENT)
                .build());

        appointmentRepository.saveAll(list);
    }

    private void seedEMR() {
        if (medicalRecordRepository.count() > 0 && clinicalNoteRepository.count() > 0) {
            return;
        }

        List<Patient> patients = patientRepository.findAll();
        List<Doctor> doctors = doctorRepository.findAll();
        List<Therapist> therapists = therapistRepository.findAll();

        if (patients.isEmpty()) {
            return;
        }

        Patient p1 = patients.get(0);
        Doctor doc = !doctors.isEmpty() ? doctors.get(0) : null;
        Therapist th = !therapists.isEmpty() ? therapists.get(0) : null;

        // 1. Seed Longitudinal Medical Record
        if (medicalRecordRepository.count() == 0) {
            PatientMedicalRecord record = PatientMedicalRecord.builder()
                    .patientId(p1.getId())
                    .clinicId("CLINIC-MAIN")
                    .bloodGroup("O+")
                    .heightCm(175.0)
                    .weightKg(70.0)
                    .bloodPressure("120/80")
                    .pulseRate(72)
                    .chronicConditions(new ArrayList<>(List.of(
                            "Mild Cervical Spondylosis",
                            "Intermittent Lumbar Strain"
                    )))
                    .allergies(new ArrayList<>(List.of(
                            "Dust mites",
                            "NSAIDs (Aspirin sensitivity)"
                    )))
                    .currentMedications(new ArrayList<>(List.of(
                            MedicationItem.builder()
                                    .name("Shallaki Capsules")
                                    .dosage("500 mg")
                                    .frequency("Twice daily after food")
                                    .purpose("Joint inflammation and stiffness")
                                    .startDate("2026-01-10")
                                    .build()
                    )))
                    .pastSurgeries(new ArrayList<>(List.of(
                            SurgeryItem.builder()
                                    .procedureName("Appendectomy")
                                    .year(2018)
                                    .hospitalOrDoctor("Apollo Hospital")
                                    .notes("Uneventful laparoscopic procedure and complete recovery")
                                    .build()
                    )))
                    .familyMedicalHistory(new ArrayList<>(List.of(
                            "Father: Hypertension (controlled on medication)",
                            "Mother: Osteoarthritis (bilateral knee)"
                    )))
                    .lifestyleHabits(new ArrayList<>(List.of(
                            "Software developer, 8+ hours desk sitting",
                            "Irregular sleep schedule (often late nights)",
                            "Moderate caffeine intake (2-3 cups tea/day)"
                    )))
                    .dietaryHabits("Vegetarian. Prefers freshly cooked meals, tendency for light breakfast and heavy late dinner. Drinks warm water.")
                    .previousTreatments("Underwent 7-day Abhyanga & Kizhi treatment in Kerala (October 2024) with marked relief in cervical stiffness.")
                    .clinicalObservations("Patient presents with cervical stiffness radiating to right trapezius. Tenderness at C5-C6 paraspinal area without radiculopathy.")
                    .prakritiDominant("Vata-Pitta")
                    .vataPercentage(50)
                    .pittaPercentage(35)
                    .kaphaPercentage(15)
                    .vikritiImbalance("Vata vitiation with mild Kapha avarana in Asthi and Majja Dhatus")
                    .agniType("Vishama Agni")
                    .amaStatus("Sama (Mild Ama present)")
                    .koshtha("Madhyama")
                    .dhatuImbalances(new ArrayList<>(List.of("Asthi Dhatu", "Meda Dhatu")))
                    .malaObservations("Mutra: Normal frequency, pale yellow. Purisha: Tendency for dryness, once daily. Sweda: Moderate with exertion.")
                    .sleepQuality("Disturbed sleep, occasional awakenings around 2-3 AM (Pitta-Vata transition period).")
                    .appetiteDigestion("Variable appetite, mild bloating when dinner is consumed after 9 PM.")
                    .auditHistory(new ArrayList<>(List.of(
                            MedicalRecordAuditItem.builder()
                                    .action("RECORD_CREATED")
                                    .performedByUserId("ADMIN-01")
                                    .performedByName("Dr. Admin")
                                    .performedByRole("ADMIN")
                                    .summary("Baseline electronic medical record established")
                                    .timestamp(LocalDateTime.now().minusDays(15))
                                    .build()
                    )))
                    .createdAt(LocalDateTime.now().minusDays(15))
                    .updatedAt(LocalDateTime.now().minusDays(1))
                    .build();

            medicalRecordRepository.save(record);
        }

        // 2. Seed Doctor Clinical Notes
        if (clinicalNoteRepository.count() == 0 && doc != null) {
            DoctorClinicalNote note1 = DoctorClinicalNote.builder()
                    .patientId(p1.getId())
                    .clinicId("CLINIC-MAIN")
                    .doctorId(doc.getId())
                    .doctorUserId(doc.getUserId())
                    .doctorName("Dr. " + doc.getFullName())
                    .doctorSpecialization(doc.getSpecialization())
                    .consultationDate(LocalDate.now().minusDays(7))
                    .consultationTime(LocalTime.of(10, 30))
                    .visitType("INITIAL_CONSULTATION")
                    .chiefComplaints("Severe stiffness in neck and shoulders with occasional lower back pain aggravated by computer work.")
                    .symptoms(new ArrayList<>(List.of(
                            "Cervical muscle spasm",
                            "Reduced neck rotation to right",
                            "Dull lumbar ache after prolonged sitting",
                            "Mild morning fatigue"
                    )))
                    .clinicalObservations("Tenderness elicited along right trapezius and rhomboids. Spurling's test negative. Lumbar flexion mildly restricted.")
                    .diagnosis("Griva Sandhigata Vata (Cervical Spondylosis) with Kati Graha")
                    .prakritiObservation("Vata-Pitta Prakriti with lean body frame, active mind")
                    .vikritiObservation("Aggravated Vyana and Apana Vayu with mild Kapha obstruction")
                    .nadiPariksha("Sarpa-Manduka Gati (Vata-Pitta), swift, slightly rough texture")
                    .jihvaPariksha("Mild white coating at posterior third of tongue indicating Samata")
                    .netraPariksha("Clear, mild dryness in conjunctiva")
                    .agniObservation("Vishama Agni with irregular hunger cycles")
                    .amaObservation("Alpa Ama (Mild toxins)")
                    .treatmentRecommendations("External oleation and fomentation (Snehana & Swedana) via Griva Basti and Nadi Sweda. Internal Vata-hara rasayanas.")
                    .prescribedMedicines(new ArrayList<>(List.of(
                            PrescribedMedicineItem.builder()
                                    .medicineName("Maharasnadi Kashayam")
                                    .formulation("Kashayam")
                                    .dosage("15 ml with 45 ml boiled warm water")
                                    .timing("Twice daily before food")
                                    .durationDays(14)
                                    .instructions("Take on empty stomach early morning and early evening")
                                    .build(),
                            PrescribedMedicineItem.builder()
                                    .medicineName("Yogaraja Guggulu")
                                    .formulation("Vati")
                                    .dosage("2 tablets")
                                    .timing("Twice daily after food with warm water")
                                    .durationDays(14)
                                    .instructions("Anti-inflammatory and joint strengthening")
                                    .build(),
                            PrescribedMedicineItem.builder()
                                    .medicineName("Ksheerabala Taila 101")
                                    .formulation("Soft Gel Capsule")
                                    .dosage("1 capsule")
                                    .timing("At bedtime with warm milk")
                                    .durationDays(14)
                                    .instructions("Nerve nourishing and promotes restful sleep")
                                    .build()
                    )))
                    .recommendedTherapies(new ArrayList<>(List.of(
                            "Griva Basti (Cervical oil pooling)",
                            "Abhyanga with Dhanwantharam Taila",
                            "Patra Pinda Sweda"
                    )))
                    .dietaryAdvice("Favor warm, cooked, grounding foods seasoned with cumin, ginger, and ghee. Strictly avoid cold, dry, and carbonated beverages.")
                    .lifestyleInstructions("Use ergonomic chair with lumbar support. Do gentle neck stretches every 45 minutes. Avoid sleeping prone.")
                    .followUpDate(LocalDate.now().plusDays(7))
                    .followUpInstructions("Return for clinical review after completing 14 days of Kashayam course.")
                    .isConfidential(false)
                    .therapistNotes(new ArrayList<>(List.of(
                            TherapyObservationItem.builder()
                                    .id(UUID.randomUUID().toString())
                                    .therapistId(th != null ? th.getId() : "TH-01")
                                    .therapistUserId(th != null ? th.getUserId() : "USR-TH-1")
                                    .therapistName(th != null ? th.getFullName() : "Kavita Nair")
                                    .therapyName("Griva Basti & Nadi Sweda")
                                    .observation("Patient tolerated 30-min Griva Basti well with warm Mahanarayana Taila. Reported immediate easing of neck tightness.")
                                    .patientFeedback("Feels much lighter and relaxed around the neck area.")
                                    .vitalPulse(74)
                                    .vitalBloodPressure("122/82")
                                    .recordedAt(LocalDateTime.now().minusDays(5))
                                    .build()
                    )))
                    .auditHistory(new ArrayList<>(List.of(
                            MedicalRecordAuditItem.builder()
                                    .action("NOTE_CREATED")
                                    .performedByUserId(doc.getUserId())
                                    .performedByName("Dr. " + doc.getFullName())
                                    .performedByRole("DOCTOR")
                                    .summary("Initial clinical consultation note authored")
                                    .timestamp(LocalDateTime.now().minusDays(7))
                                    .build()
                    )))
                    .createdAt(LocalDateTime.now().minusDays(7))
                    .updatedAt(LocalDateTime.now().minusDays(5))
                    .build();

            clinicalNoteRepository.save(note1);
        }
    }
}
