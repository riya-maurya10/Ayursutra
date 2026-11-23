package com.ayursutra.repository;

import com.ayursutra.constant.NotificationStatus;
import com.ayursutra.entity.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository
        extends MongoRepository<Notification, String> {

    List<Notification> findByRecipientIdOrderByCreatedAtDesc(
            String recipientId
    );

    List<Notification> findByRecipientIdAndStatusOrderByCreatedAtDesc(
            String recipientId,
            NotificationStatus status
    );

    long countByRecipientIdAndStatus(
            String recipientId,
            NotificationStatus status
    );

    Optional<Notification> findByIdAndRecipientId(
            String id,
            String recipientId
    );

    void deleteByIdAndRecipientId(
            String id,
            String recipientId
    );

    boolean existsByRecipientIdAndTherapySessionIdAndType(
            String recipientId,
            String therapySessionId,
            String type
    );
}