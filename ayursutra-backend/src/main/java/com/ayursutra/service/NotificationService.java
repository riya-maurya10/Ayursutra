package com.ayursutra.service;

import com.ayursutra.dto.request.NotificationRequest;
import com.ayursutra.dto.response.NotificationResponse;

import java.util.List;

public interface NotificationService {

    NotificationResponse createNotification(
            NotificationRequest request
    );

    List<NotificationResponse> getAllNotifications();

    NotificationResponse getNotificationById(
            String id
    );

    List<NotificationResponse> getNotificationsByRecipient(
            String recipientId
    );

    List<NotificationResponse> getUnreadNotifications(
            String recipientId
    );

    long getUnreadCount(
            String recipientId
    );

    NotificationResponse markAsRead(
            String id
    );

    void deleteNotification(
            String id
    );

    void createTherapyReminder(
            String therapySessionId
    );

    // =========================================================
    // AUTHENTICATED USER SELF-SERVICE APIS (JWT IDENTITY)
    // =========================================================

    List<NotificationResponse> getMyNotifications();

    long getMyUnreadCount();

    NotificationResponse markMyNotificationAsRead(String id);

    void markAllMyNotificationsAsRead();

    void deleteMyNotification(String id);

    // =========================================================
    // ROLE & USER NOTIFICATION DISPATCH HELPERS
    // =========================================================

    void sendNotificationToUser(
            String userId,
            String title,
            String message,
            com.ayursutra.constant.NotificationType type,
            String link
    );

    void sendNotificationToRole(
            com.ayursutra.constant.Role role,
            String title,
            String message,
            com.ayursutra.constant.NotificationType type,
            String link
    );
}