package com.ayursutra.service.impl;

import com.ayursutra.constant.NotificationStatus;
import com.ayursutra.constant.NotificationType;
import com.ayursutra.constant.Role;
import com.ayursutra.dto.request.NotificationRequest;
import com.ayursutra.dto.response.NotificationResponse;
import com.ayursutra.dto.response.TherapySessionResponse;
import com.ayursutra.entity.Notification;
import com.ayursutra.entity.User;
import com.ayursutra.repository.NotificationRepository;
import com.ayursutra.repository.UserRepository;
import com.ayursutra.security.UserPrincipal;
import com.ayursutra.service.NotificationService;
import com.ayursutra.service.TherapySessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl
        implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final TherapySessionService therapySessionService;
    private final UserRepository userRepository;


    @Override
    public NotificationResponse createNotification(
            NotificationRequest request) {

        Notification notification = new Notification();

        notification.setRecipientId(
                request.getRecipientId()
        );

        notification.setPatientId(
                request.getPatientId()
        );

        notification.setTherapistId(
                request.getTherapistId()
        );

        notification.setDoctorId(
                request.getDoctorId()
        );

        notification.setTherapySessionId(
                request.getTherapySessionId()
        );

        notification.setTherapyPlanId(
                request.getTherapyPlanId()
        );

        notification.setType(
                request.getType()
        );

        notification.setStatus(
                NotificationStatus.UNREAD
        );

        notification.setTitle(
                request.getTitle()
        );

        notification.setMessage(
                request.getMessage()
        );

        notification.setLink(
                request.getLink()
        );

        notification.setCreatedAt(
                LocalDateTime.now()
        );

        Notification saved =
                notificationRepository.save(notification);

        return toResponse(saved);
    }


    @Override
    public List<NotificationResponse>
    getAllNotifications() {

        return notificationRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }


    @Override
    public NotificationResponse getNotificationById(
            String id) {

        Notification notification =
                notificationRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Notification not found"
                                )
                        );

        return toResponse(notification);
    }


    @Override
    public List<NotificationResponse>
    getNotificationsByRecipient(
            String recipientId) {

        return notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(
                        recipientId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }


    @Override
    public List<NotificationResponse>
    getUnreadNotifications(
            String recipientId) {

        return notificationRepository
                .findByRecipientIdAndStatusOrderByCreatedAtDesc(
                        recipientId,
                        NotificationStatus.UNREAD
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }


    @Override
    public long getUnreadCount(
            String recipientId) {

        return notificationRepository
                .countByRecipientIdAndStatus(
                        recipientId,
                        NotificationStatus.UNREAD
                );
    }


    @Override
    public NotificationResponse markAsRead(
            String id) {

        Notification notification =
                notificationRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Notification not found"
                                )
                        );

        notification.setStatus(
                NotificationStatus.READ
        );

        notification.setReadAt(
                LocalDateTime.now()
        );

        Notification updated =
                notificationRepository.save(notification);

        return toResponse(updated);
    }


    @Override
    public void deleteNotification(
            String id) {

        if (!notificationRepository.existsById(id)) {

            throw new RuntimeException(
                    "Notification not found"
            );
        }

        notificationRepository.deleteById(id);
    }


    @Override
    public void createTherapyReminder(
            String therapySessionId) {

        TherapySessionResponse session =
                therapySessionService.getSessionById(
                        therapySessionId
                );

        String message =
                "Your "
                        + session.getTherapyName()
                        + " therapy is scheduled on "
                        + session.getSessionDate()
                        + " at "
                        + session.getStartTime()
                        + ".";


        /*
         * Patient notification
         */
        if (session.getPatientId() != null) {

            createReminderIfNotExists(
                    session.getPatientId(),
                    session,
                    session.getPatientId(),
                    null,
                    null
            );
        }


        /*
         * Therapist notification
         */
        if (session.getTherapistId() != null) {

            createReminderIfNotExists(
                    session.getTherapistId(),
                    session,
                    null,
                    session.getTherapistId(),
                    null
            );
        }
    }


    private void createReminderIfNotExists(
            String recipientId,
            TherapySessionResponse session,
            String patientId,
            String therapistId,
            String doctorId) {

        boolean alreadyExists =
                notificationRepository
                        .existsByRecipientIdAndTherapySessionIdAndType(
                                recipientId,
                                session.getId(),
                                NotificationType.THERAPY_REMINDER.name()
                        );

        if (alreadyExists) {
            return;
        }

        Notification notification =
                new Notification();

        notification.setRecipientId(
                recipientId
        );

        notification.setPatientId(
                patientId
        );

        notification.setTherapistId(
                therapistId
        );

        notification.setDoctorId(
                doctorId
        );

        notification.setTherapySessionId(
                session.getId()
        );

        notification.setTherapyPlanId(
                session.getTherapyPlanId()
        );

        notification.setType(
                NotificationType.THERAPY_REMINDER
        );

        notification.setStatus(
                NotificationStatus.UNREAD
        );

        notification.setTitle(
                "Therapy Session Reminder"
        );

        notification.setMessage(
                "Your "
                        + session.getTherapyName()
                        + " therapy is scheduled on "
                        + session.getSessionDate()
                        + " at "
                        + session.getStartTime()
                        + "."
        );

        notification.setScheduledAt(
                session.getSessionDate()
                        .atTime(session.getStartTime())
        );

        notification.setCreatedAt(
                LocalDateTime.now()
        );

        notificationRepository.save(
                notification
        );
    }


    private NotificationResponse toResponse(
            Notification notification) {

        NotificationResponse response =
                new NotificationResponse();

        response.setId(notification.getId());

        response.setRecipientId(
                notification.getRecipientId()
        );

        response.setPatientId(
                notification.getPatientId()
        );

        response.setTherapistId(
                notification.getTherapistId()
        );

        response.setDoctorId(
                notification.getDoctorId()
        );

        response.setTherapySessionId(
                notification.getTherapySessionId()
        );

        response.setTherapyPlanId(
                notification.getTherapyPlanId()
        );

        response.setType(
                notification.getType()
        );

        response.setStatus(
                notification.getStatus()
        );

        response.setTitle(
                notification.getTitle()
        );

        response.setMessage(
                notification.getMessage()
        );

        response.setScheduledAt(
                notification.getScheduledAt()
        );

        response.setCreatedAt(
                notification.getCreatedAt()
        );

        response.setLink(
                notification.getLink()
        );

        response.setReadAt(
                notification.getReadAt()
        );

        return response;
    }

    // =========================================================
    // AUTHENTICATED USER SELF-SERVICE APIS (JWT IDENTITY)
    // =========================================================

    private String getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserPrincipal)) {
            throw new RuntimeException("User is not authenticated");
        }
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        return principal.getUser().getId();
    }

    @Override
    public List<NotificationResponse> getMyNotifications() {
        String userId = getAuthenticatedUserId();
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public long getMyUnreadCount() {
        String userId = getAuthenticatedUserId();
        return notificationRepository.countByRecipientIdAndStatus(userId, NotificationStatus.UNREAD);
    }

    @Override
    public NotificationResponse markMyNotificationAsRead(String id) {
        String userId = getAuthenticatedUserId();
        Notification notification = notificationRepository.findByIdAndRecipientId(id, userId)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));

        notification.setStatus(NotificationStatus.READ);
        notification.setReadAt(LocalDateTime.now());
        Notification saved = notificationRepository.save(notification);
        return toResponse(saved);
    }

    @Override
    public void markAllMyNotificationsAsRead() {
        String userId = getAuthenticatedUserId();
        List<Notification> unread = notificationRepository.findByRecipientIdAndStatusOrderByCreatedAtDesc(
                userId,
                NotificationStatus.UNREAD
        );
        LocalDateTime now = LocalDateTime.now();
        for (Notification n : unread) {
            n.setStatus(NotificationStatus.READ);
            n.setReadAt(now);
        }
        notificationRepository.saveAll(unread);
    }

    @Override
    public void deleteMyNotification(String id) {
        String userId = getAuthenticatedUserId();
        Notification notification = notificationRepository.findByIdAndRecipientId(id, userId)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));
        notificationRepository.delete(notification);
    }

    // =========================================================
    // ROLE & USER NOTIFICATION DISPATCH HELPERS
    // =========================================================

    @Override
    public void sendNotificationToUser(
            String userId,
            String title,
            String message,
            NotificationType type,
            String link) {

        if (userId == null || userId.isBlank()) {
            return;
        }

        Notification notification = new Notification();
        notification.setRecipientId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setStatus(NotificationStatus.UNREAD);
        notification.setLink(link);
        notification.setCreatedAt(LocalDateTime.now());

        notificationRepository.save(notification);
    }

    @Override
    public void sendNotificationToRole(
            Role role,
            String title,
            String message,
            NotificationType type,
            String link) {

        if (role == null) {
            return;
        }

        List<User> users = userRepository.findByRole(role);
        if (users == null || users.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        List<Notification> notifications = users.stream().map(u -> {
            Notification n = new Notification();
            n.setRecipientId(u.getId());
            n.setTitle(title);
            n.setMessage(message);
            n.setType(type);
            n.setStatus(NotificationStatus.UNREAD);
            n.setLink(link);
            n.setCreatedAt(now);
            return n;
        }).toList();

        notificationRepository.saveAll(notifications);
    }
}