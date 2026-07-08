"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Bell, User } from "lucide-react";
import { SidebarContent } from "./Sidebar";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/requests": "Session Requests",
  "/doubts": "Doubts & Questions",
  "/rankings": "Company Rankings",
  "/reports": "Export Reports",
  "/profile": "Profile",
  "/notifications": "Notifications",
  "/students": "Student Matrix",
  "/leaderboard": "Leaderboard ",
};

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const title = pageTitles[pathname] || "Faculty Portal";

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo container */}
        <div className="hidden lg:flex items-center gap-3 w-[var(--sidebar-width)] shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-700 to-blue-600 text-sm font-bold text-white shadow-md shadow-blue-500/30">
            NST
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight text-gray-900">PlacePrep</h1>
            <p className="text-[10px] font-medium text-blue-600">Faculty Portal</p>
          </div>
        </div>

        {/* Page title */}
        <h1 className="text-base font-bold text-gray-900 lg:text-lg flex-1 lg:pl-4">
          {title}
        </h1>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <Link
            href="/notifications"
            className="relative p-2 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </Link>
          <Link
            href="/profile"
            className="hidden sm:flex p-2 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <User className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-[var(--sidebar-width)] bg-white shadow-xl z-50 animate-in slide-in-from-left duration-200">
            <div className="absolute top-3 right-3">
              <button
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
