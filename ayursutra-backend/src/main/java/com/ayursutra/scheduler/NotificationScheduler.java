package com.ayursutra.scheduler;

import com.ayursutra.constant.AppointmentStatus;
import com.ayursutra.constant.NotificationType;
import com.ayursutra.dto.response.TherapySessionResponse;
import com.ayursutra.entity.Appointment;
import com.ayursutra.repository.AppointmentRepository;
import com.ayursutra.service.NotificationService;
import com.ayursutra.service.TherapySessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class NotificationScheduler {

    private final TherapySessionService therapySessionService;
    private final NotificationService notificationService;
    private final AppointmentRepository appointmentRepository;

    /*
     * Runs every minute.
     *
     * Finds today's therapy sessions and creates
     * a reminder when the session is within
     * the next 30 minutes.
     */
    @Scheduled(fixedRate = 60000)
    public void generateTherapyReminders() {

        LocalDate today =
                LocalDate.now();

        LocalDateTime now =
                LocalDateTime.now();

        LocalDateTime reminderWindowEnd =
                now.plusMinutes(30);

        List<TherapySessionResponse> sessions =
                therapySessionService
                        .getSessionsByDate(
                                today.toString()
                        );

        for (TherapySessionResponse session : sessions) {

            if (session.getStartTime() == null) {
                continue;
            }

            LocalDateTime sessionDateTime =
                    LocalDateTime.of(
                            today,
                            session.getStartTime()
                    );

            if (!sessionDateTime.isBefore(now)
                    && !sessionDateTime.isAfter(
                    reminderWindowEnd
            )) {

                notificationService
                        .createTherapyReminder(
                                session.getId()
                        );
            }
        }
    }

    /*
     * Runs every minute.
     *
     * 1. Finds today's confirmed appointments and creates
     * a reminder when the appointment is within the next 45 minutes.
     * 2. Detects missed appointments / no-shows after the appointment
     * end time has elapsed.
     */
    @Scheduled(fixedRate = 60000)
    public void generateAppointmentReminders() {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime reminderWindowEnd = now.plusMinutes(45);

        // 1. Upcoming Appointments
        List<Appointment> upcoming = appointmentRepository.findByAppointmentDateAndStatusAndReminderSentFalse(
                today,
                AppointmentStatus.CONFIRMED
        );

        for (Appointment appt : upcoming) {
            if (appt.getStartTime() == null) {
                continue;
            }

            LocalDateTime apptDateTime = LocalDateTime.of(today, appt.getStartTime());

            if (!apptDateTime.isBefore(now) && !apptDateTime.isAfter(reminderWindowEnd)) {
                if (appt.getPatientId() != null) {
                    notificationService.sendNotificationToUser(
                            appt.getPatientId(),
                            "Upcoming Appointment Reminder",
                            "Reminder: Your consultation with Dr. " + appt.getDoctorName() + " is scheduled today at " + appt.getStartTime() + ".",
                            NotificationType.APPOINTMENT_REMINDER,
                            "/patient/appointments"
                    );
                }

                if (appt.getDoctorUserId() != null) {
                    notificationService.sendNotificationToUser(
                            appt.getDoctorUserId(),
                            "Upcoming Consultation: " + appt.getPatientName(),
                            "Consultation with " + appt.getPatientName() + " is scheduled at " + appt.getStartTime() + " today.",
                            NotificationType.APPOINTMENT_REMINDER,
                            "/doctor/appointments"
                    );
                }

                appt.setReminderSent(true);
                appointmentRepository.save(appt);
            }
        }

        // 2. Missed / No-Show Appointments
        List<Appointment> pendingOrConfirmed = appointmentRepository
                .findByAppointmentDateAndStatusInAndArrivalRecordedFalseAndMissedReminderSentFalse(
                        today,
                        List.of(AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING, AppointmentStatus.RESCHEDULED)
                );

        for (Appointment appt : pendingOrConfirmed) {
            if (appt.getEndTime() == null) {
                continue;
            }

            LocalDateTime apptEndDateTime = LocalDateTime.of(today, appt.getEndTime());

            if (now.isAfter(apptEndDateTime.plusMinutes(30))) {
                if (appt.getPatientId() != null) {
                    notificationService.sendNotificationToUser(
                            appt.getPatientId(),
                            "Missed Appointment Notice",
                            "You missed your scheduled appointment with Dr. " + appt.getDoctorName() + " on " + today + ". Please reschedule if needed.",
                            NotificationType.APPOINTMENT_MISSED,
                            "/patient/appointments"
                    );
                }

                if (appt.getDoctorUserId() != null) {
                    notificationService.sendNotificationToUser(
                            appt.getDoctorUserId(),
                            "Patient No-Show Notice",
                            "Patient " + appt.getPatientName() + " did not attend their " + appt.getStartTime() + " consultation.",
                            NotificationType.APPOINTMENT_MISSED,
                            "/doctor/appointments"
                    );
                }

                appt.setMissedReminderSent(true);
                appt.setStatus(AppointmentStatus.NO_SHOW);
                appointmentRepository.save(appt);
            }
        }
    }
}
