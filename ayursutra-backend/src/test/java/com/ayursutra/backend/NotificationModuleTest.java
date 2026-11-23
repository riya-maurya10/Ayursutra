package com.ayursutra.backend;

import com.ayursutra.constant.NotificationStatus;
import com.ayursutra.constant.NotificationType;
import com.ayursutra.constant.Role;
import com.ayursutra.dto.response.NotificationResponse;
import com.ayursutra.entity.Notification;
import com.ayursutra.entity.User;
import com.ayursutra.repository.NotificationRepository;
import com.ayursutra.repository.UserRepository;
import com.ayursutra.security.UserPrincipal;
import com.ayursutra.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NotificationModuleTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    private NotificationServiceImpl notificationService;

    private final String CURRENT_USER_ID = "USER-100";
    private final String OTHER_USER_ID = "USER-999";

    @BeforeEach
    void setUp() {
        notificationService = new NotificationServiceImpl(
                notificationRepository,
                null,
                userRepository
        );

        User currentUser = new User();
        currentUser.setId(CURRENT_USER_ID);
        currentUser.setEmail("doctor@ayursutra.com");
        currentUser.setFullName("Dr. Rajesh Sharma");
        currentUser.setRole(Role.DOCTOR);

        UserPrincipal principal = new UserPrincipal(currentUser);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("getMyNotifications fetches only current user's notifications sorted newest first")
    void testGetMyNotifications() {
        Notification n1 = new Notification();
        n1.setId("NOTIF-1");
        n1.setRecipientId(CURRENT_USER_ID);
        n1.setTitle("Session Assigned");
        n1.setMessage("New therapy scheduled.");
        n1.setType(NotificationType.THERAPY_SCHEDULED);
        n1.setStatus(NotificationStatus.UNREAD);
        n1.setCreatedAt(LocalDateTime.now());

        when(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(CURRENT_USER_ID))
                .thenReturn(List.of(n1));

        List<NotificationResponse> list = notificationService.getMyNotifications();

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("NOTIF-1", list.get(0).getId());
        assertEquals(CURRENT_USER_ID, list.get(0).getRecipientId());
        verify(notificationRepository, times(1))
                .findByRecipientIdOrderByCreatedAtDesc(CURRENT_USER_ID);
    }

    @Test
    @DisplayName("getMyUnreadCount queries count by current user recipient ID and UNREAD status")
    void testGetMyUnreadCount() {
        when(notificationRepository.countByRecipientIdAndStatus(CURRENT_USER_ID, NotificationStatus.UNREAD))
                .thenReturn(3L);

        long count = notificationService.getMyUnreadCount();

        assertEquals(3L, count);
        verify(notificationRepository, times(1))
                .countByRecipientIdAndStatus(CURRENT_USER_ID, NotificationStatus.UNREAD);
    }

    @Test
    @DisplayName("markMyNotificationAsRead updates status to READ and sets readAt timestamp")
    void testMarkMyNotificationAsRead() {
        Notification n = new Notification();
        n.setId("NOTIF-2");
        n.setRecipientId(CURRENT_USER_ID);
        n.setStatus(NotificationStatus.UNREAD);

        when(notificationRepository.findByIdAndRecipientId("NOTIF-2", CURRENT_USER_ID))
                .thenReturn(Optional.of(n));
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        NotificationResponse response = notificationService.markMyNotificationAsRead("NOTIF-2");

        assertNotNull(response);
        assertEquals(NotificationStatus.READ, response.getStatus());
        assertNotNull(response.getReadAt());
        verify(notificationRepository, times(1)).save(n);
    }

    @Test
    @DisplayName("markMyNotificationAsRead fails when notification belongs to another user")
    void testMarkMyNotificationAsRead_Unauthorized() {
        when(notificationRepository.findByIdAndRecipientId("NOTIF-FOREIGN", CURRENT_USER_ID))
                .thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () ->
                notificationService.markMyNotificationAsRead("NOTIF-FOREIGN")
        );
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("markAllMyNotificationsAsRead updates all unread notifications for current user")
    void testMarkAllMyNotificationsAsRead() {
        Notification n1 = new Notification();
        n1.setId("NOTIF-10");
        n1.setRecipientId(CURRENT_USER_ID);
        n1.setStatus(NotificationStatus.UNREAD);

        Notification n2 = new Notification();
        n2.setId("NOTIF-11");
        n2.setRecipientId(CURRENT_USER_ID);
        n2.setStatus(NotificationStatus.UNREAD);

        when(notificationRepository.findByRecipientIdAndStatusOrderByCreatedAtDesc(
                CURRENT_USER_ID,
                NotificationStatus.UNREAD
        )).thenReturn(List.of(n1, n2));

        notificationService.markAllMyNotificationsAsRead();

        assertEquals(NotificationStatus.READ, n1.getStatus());
        assertEquals(NotificationStatus.READ, n2.getStatus());
        assertNotNull(n1.getReadAt());
        assertNotNull(n2.getReadAt());
        verify(notificationRepository, times(1)).saveAll(List.of(n1, n2));
    }

    @Test
    @DisplayName("deleteMyNotification deletes notification owned by current user")
    void testDeleteMyNotification_Success() {
        Notification n = new Notification();
        n.setId("NOTIF-20");
        n.setRecipientId(CURRENT_USER_ID);

        when(notificationRepository.findByIdAndRecipientId("NOTIF-20", CURRENT_USER_ID))
                .thenReturn(Optional.of(n));

        notificationService.deleteMyNotification("NOTIF-20");

        verify(notificationRepository, times(1)).delete(n);
    }

    @Test
    @DisplayName("deleteMyNotification prevents deleting another user's notification")
    void testDeleteMyNotification_Forbidden() {
        when(notificationRepository.findByIdAndRecipientId("NOTIF-OTHER", CURRENT_USER_ID))
                .thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () ->
                notificationService.deleteMyNotification("NOTIF-OTHER")
        );
        verify(notificationRepository, never()).delete(any());
    }

    @Test
    @DisplayName("sendNotificationToRole broadcasts notifications to all users of specified role")
    void testSendNotificationToRole() {
        User admin1 = new User();
        admin1.setId("ADM-1");
        User admin2 = new User();
        admin2.setId("ADM-2");

        when(userRepository.findByRole(Role.ADMIN)).thenReturn(List.of(admin1, admin2));

        notificationService.sendNotificationToRole(
                Role.ADMIN,
                "Low Stock Alert",
                "Herb supply is low",
                NotificationType.INVENTORY_ALERT,
                "/admin/inventory"
        );

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository, times(1)).saveAll(captor.capture());

        List<Notification> captured = captor.getValue();
        assertEquals(2, captured.size());
        assertEquals("ADM-1", captured.get(0).getRecipientId());
        assertEquals("ADM-2", captured.get(1).getRecipientId());
        assertEquals("Low Stock Alert", captured.get(0).getTitle());
        assertEquals("/admin/inventory", captured.get(0).getLink());
    }
}
