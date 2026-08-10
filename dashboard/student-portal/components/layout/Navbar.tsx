"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Zap, Menu } from "lucide-react";
import { useNavbar } from "@/lib/navbar-context";
import { useProfile } from "@/lib/hooks";

// Unread notification count — reads from API
function useUnreadCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    // Fetch unread notification count from backend API
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications/unread-count');
        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();
            setCount(data.unreadCount || 0);
          }
        }
      } catch (error) {
        console.error('Failed to fetch unread notifications count:', error);
      }
    };

    fetchUnreadCount();

    // Poll every 60 seconds
    const intervalId = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(intervalId);
  }, []);
  return count;
}

export default function Navbar() {
  const { data: profile } = useProfile();
  const user = profile ? {
    imageUrl: profile.avatarUrl,
    fullName: profile.fullName,
    firstName: profile.fullName?.split(" ")[0],
    xp: profile.xpTotal
  } : null;

  const { isMobileMenuOpen, setMobileMenuOpen } = useNavbar();
  const unreadCount = useUnreadCount();

  // BUG-FIX: derive XP from live profile data (was hardcoded 2450 fallback)
  const xp = user?.xp ?? 0;

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 z-50 gap-2 lg:gap-0">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
        className="p-1.5 -ml-1.5 text-gray-600 hover:bg-gray-100 rounded-md lg:hidden"
        aria-label="Toggle Sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2 lg:w-[216px] shrink-0">
        <div className="bg-blue-700 rounded px-2 py-1 text-white font-bold text-xs">NST</div>
        <span className="font-bold text-gray-900 text-sm hidden sm:inline-block">PlacePrep</span>
      </div>

      {/* BUG-FIX A1: removed global search bar that was rendered only on /dashboard */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-3.5 ml-auto">
        {/* XP Badge */}
        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 hover:bg-amber-100 transition-colors cursor-default shrink-0">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="text-xs font-bold text-amber-700">{xp.toLocaleString()}</span>
          <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-wide">XP</span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 shrink-0" />

        {/* Notification Bell */}
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 shrink-0"
          onClick={() => sessionStorage.setItem("notifications_last_read", new Date().toISOString())}
        >
          <Bell className="w-4.5 h-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold px-0.5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Avatar — links to /profile page */}
        <Link
          href="/profile"
          aria-label="Profile"
          className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-blue-400 transition-all flex items-center justify-center shrink-0"
          title="View Profile"
        >
          {user?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.imageUrl}
              alt={user.fullName ?? "Profile"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
              {user?.firstName?.[0] ?? "U"}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
