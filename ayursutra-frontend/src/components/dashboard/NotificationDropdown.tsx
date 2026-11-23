import React, { useState, useEffect, useRef, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  UserCheck,
  UserPlus,
  Calendar,
  Sparkles,
  Receipt,
  Heart,
  ShieldCheck,
  Clock,
} from "lucide-react";
import type { NotificationItem, NotificationType } from "../../types/notification";
import {
  getMyNotifications,
  getMyUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../../services/notification/notificationService";

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [, startTransition] = useTransition();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load notifications from server
  const loadNotifications = async () => {
    try {
      const [list, count] = await Promise.all([
        getMyNotifications(),
        getMyUnreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    }
  };

  // Initial fetch and auto-polling every 30s
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch when dropdown is opened
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle Mark Single As Read
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "READ" as const, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  // Handle Mark All As Read
  const handleMarkAllAsRead = async () => {
    try {
      setIsLoading(true);
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: "READ" as const, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Delete Single
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = notifications.find((n) => n.id === id);
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target?.status === "UNREAD") {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  // Handle Notification Click (Read + Navigate)
  const handleItemClick = async (item: NotificationItem) => {
    if (item.status === "UNREAD") {
      await handleMarkAsRead(item.id);
    }
    setIsOpen(false);
    if (item.link) {
      startTransition(() => {
        navigate(item.link!);
      });
    }
  };

  // Format Relative Timestamp
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  // Get icon and colors by notification type
  const getTypeConfig = (type: NotificationType) => {
    switch (type) {
      case "INVENTORY_ALERT":
        return {
          icon: <AlertTriangle size={16} className="text-[#A46A4C]" />,
          bg: "bg-[#A46A4C]/10 border-[#A46A4C]/20",
        };
      case "STAFF_REGISTRATION":
      case "STAFF_VERIFICATION":
        return {
          icon: <UserCheck size={16} className="text-[#1F3D2E]" />,
          bg: "bg-[#1F3D2E]/10 border-[#1F3D2E]/20",
        };
      case "PATIENT_REGISTRATION":
      case "PATIENT_ASSIGNMENT":
      case "PATIENT_ARRIVAL":
        return {
          icon: <UserPlus size={16} className="text-[#2D5A40]" />,
          bg: "bg-[#2D5A40]/10 border-[#2D5A40]/20",
        };
      case "THERAPY_SCHEDULED":
      case "THERAPY_REMINDER":
      case "THERAPY_COMPLETED":
      case "THERAPY_PLAN_UPDATE":
      case "APPOINTMENT_BOOKED":
      case "APPOINTMENT_CANCELLED":
      case "APPOINTMENT_REMINDER":
        return {
          icon: <Calendar size={16} className="text-[#1F3D2E]" />,
          bg: "bg-[#1F3D2E]/10 border-[#1F3D2E]/20",
        };
      case "BILLING_UPDATE":
        return {
          icon: <Receipt size={16} className="text-[#7A5A3A]" />,
          bg: "bg-[#7A5A3A]/10 border-[#7A5A3A]/20",
        };
      case "DIET_REMINDER":
      case "MEDICINE_REMINDER":
      case "PATIENT_PROGRESS":
      case "PROGRESS_REMINDER":
        return {
          icon: <Heart size={16} className="text-[#A46A4C]" />,
          bg: "bg-[#A46A4C]/10 border-[#A46A4C]/20",
        };
      case "CLINIC_ALERT":
        return {
          icon: <ShieldCheck size={16} className="text-[#1F3D2E]" />,
          bg: "bg-[#1F3D2E]/10 border-[#1F3D2E]/20",
        };
      default:
        return {
          icon: <Sparkles size={16} className="text-[#1F3D2E]" />,
          bg: "bg-[#1F3D2E]/10 border-[#1F3D2E]/20",
        };
    }
  };

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => n.status === "UNREAD")
      : notifications;

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative rounded-xl p-2.5 text-[#4D5C4B] transition hover:bg-[#F8F6F0] focus:outline-none ${
          isOpen ? "bg-[#F8F6F0] text-[#1F3D2E]" : ""
        }`}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1F3D2E] px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white"
            title={`${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-[#D9DDCE] bg-white shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#ECEFE6] bg-[#F8F6F0]/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-serif text-base font-semibold text-[#1F3D2E]">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#1F3D2E]/10 px-2 py-0.5 text-xs font-semibold text-[#1F3D2E]">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs font-medium text-[#1F3D2E] hover:text-[#2D5A40] transition disabled:opacity-50"
                title="Mark all as read"
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-[#ECEFE6] bg-[#F8F6F0]/40 px-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`flex-1 pb-2 text-xs font-semibold transition border-b-2 ${
                activeTab === "all"
                  ? "border-[#1F3D2E] text-[#1F3D2E]"
                  : "border-transparent text-[#7A806F] hover:text-[#4D5C4B]"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={`flex-1 pb-2 text-xs font-semibold transition border-b-2 ${
                activeTab === "unread"
                  ? "border-[#1F3D2E] text-[#1F3D2E]"
                  : "border-transparent text-[#7A806F] hover:text-[#4D5C4B]"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-96 divide-y divide-[#ECEFE6] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F6F0] text-[#7A806F]">
                  <BellOff size={22} />
                </div>
                <p className="text-sm font-semibold text-[#1F3D2E]">
                  {activeTab === "unread" ? "No unread notifications" : "No notifications yet"}
                </p>
                <p className="mt-1 text-xs text-[#7A806F] max-w-xs">
                  {activeTab === "unread"
                    ? "You are all caught up with your alerts and clinical updates."
                    : "Important activity, appointment schedules, and clinic alerts will appear here."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isUnread = item.status === "UNREAD";
                const typeConfig = getTypeConfig(item.type);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`group relative flex items-start gap-3 p-3.5 transition cursor-pointer hover:bg-[#F8F6F0]/70 ${
                      isUnread ? "bg-[#FAF8F5]" : "bg-white"
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${typeConfig.bg}`}
                    >
                      {typeConfig.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={`text-xs font-semibold truncate ${
                            isUnread ? "text-[#1F3D2E]" : "text-[#4D5C4B]"
                          }`}
                        >
                          {item.title}
                        </p>
                        {isUnread && (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#A46A4C]"
                            title="Unread"
                          />
                        )}
                      </div>

                      <p className="mt-0.5 text-xs text-[#5C6757] line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-[#8C9384]">
                        <Clock size={11} />
                        <span>{formatTimeAgo(item.createdAt)}</span>
                      </div>
                    </div>

                    {/* Quick action buttons on hover / right edge */}
                    <div className="absolute right-2.5 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(item.id, e)}
                          title="Mark as read"
                          className="rounded-lg p-1 text-[#4D5C4B] hover:bg-[#D9DDCE]/50 hover:text-[#1F3D2E] transition"
                        >
                          <Check size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, e)}
                        title="Delete notification"
                        className="rounded-lg p-1 text-[#8C9384] hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          {filteredNotifications.length > 0 && (
            <div className="border-t border-[#ECEFE6] bg-[#F8F6F0]/50 px-4 py-2 text-center text-[11px] text-[#7A806F]">
              Click any notification to navigate to details
            </div>
          )}
        </div>
      )}
    </div>
  );
};
