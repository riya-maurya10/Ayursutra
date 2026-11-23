import apiClient from "../api/client";
import type { NotificationItem } from "../../types/notification";
import type { ApiResponse } from "../../types/auth";

export async function getMyNotifications(): Promise<NotificationItem[]> {
  const response = await apiClient.get<ApiResponse<NotificationItem[]>>("/notifications");
  return response.data.data ?? [];
}

export async function getMyUnreadCount(): Promise<number> {
  const response = await apiClient.get<ApiResponse<number>>("/notifications/unread-count");
  return response.data.data ?? 0;
}

export async function markNotificationAsRead(id: string): Promise<NotificationItem> {
  const response = await apiClient.put<ApiResponse<NotificationItem>>(`/notifications/${id}/read`);
  return response.data.data;
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.put<ApiResponse<string>>("/notifications/read-all");
}

export async function deleteNotification(id: string): Promise<void> {
  await apiClient.delete<ApiResponse<string>>(`/notifications/${id}`);
}
