"use client";

import { useState } from "react";
import { Bell, CheckCircle2, MessageCircle, X } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New Session Request",
      message: "Maya Singh has requested a System Design mock interview.",
      time: "10 minutes ago",
      type: "request",
      unread: true,
    },
    {
      id: 2,
      title: "Doubt Unresolved",
      message: "Kavya Rao is waiting for clarification on HLD vs LLD.",
      time: "2 hours ago",
      type: "doubt",
      unread: true,
    },
    {
      id: 3,
      title: "System Update",
      message: "The curriculum matrix has been updated for Q3.",
      time: "1 day ago",
      type: "system",
      unread: false,
    },
  ]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const toggleReadStatus = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))
    );
  };

  const handleDismiss = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-blue-600 font-semibold mt-1">
              You have {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            onClick={() => toggleReadStatus(notification.id)}
            className={`p-4 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer relative group ${
              notification.unread ? "bg-blue-50/40" : ""
            }`}
          >
            {/* Left accent bar for unread */}
            {notification.unread && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-600 rounded-r" />
            )}

            <div className="mt-1">
              {notification.type === "request" && (
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center ring-2 ring-blue-50">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                </div>
              )}
              {notification.type === "doubt" && (
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center ring-2 ring-amber-50">
                  <MessageCircle className="w-4 h-4 text-amber-600" />
                </div>
              )}
              {notification.type === "system" && (
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center ring-2 ring-gray-50">
                  <Bell className="w-4 h-4 text-gray-500" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-8">
              <div className="flex items-center justify-between gap-4">
                <h3 className={`text-sm ${notification.unread ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>
                  {notification.title}
                </h3>
                <span className="text-[11px] text-gray-400 font-medium shrink-0">{notification.time}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{notification.message}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {notification.unread && (
                <div className="w-2 h-2 rounded-full bg-blue-600" />
              )}
              <button
                onClick={(e) => handleDismiss(notification.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-400">You have no notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
