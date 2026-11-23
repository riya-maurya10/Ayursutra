import React from "react";
import type { AppointmentStatus } from "../../types/appointment";

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
  size?: "sm" | "md";
}

export const AppointmentStatusBadge: React.FC<AppointmentStatusBadgeProps> = ({
  status,
  size = "md",
}) => {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  switch (status) {
    case "CONFIRMED":
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
          Confirmed
        </span>
      );
    case "PENDING":
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
          Pending
        </span>
      );
    case "RESCHEDULED":
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
          Rescheduled
        </span>
      );
    case "COMPLETED":
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-[#1F3D2E]/10 text-[#1F3D2E] border border-[#1F3D2E]/20 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#1F3D2E] mr-1.5" />
          Completed
        </span>
      );
    case "CANCELLED":
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-red-50 text-red-700 border border-red-200/60 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
          Cancelled
        </span>
      );
    case "NO_SHOW":
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-300 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-1.5" />
          No Show
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-gray-50 text-gray-600 border border-gray-200 ${sizeClasses}`}
        >
          {status}
        </span>
      );
  }
};
