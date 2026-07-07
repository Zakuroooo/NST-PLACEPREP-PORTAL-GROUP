"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  LayoutDashboard,
  // Map,
  MessageCircle,
  Send,
  TrendingUp,
  LogOut,
  LayoutList,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Session Requests", href: "/requests", icon: CalendarDays },
  { name: "Doubts & Questions", href: "/doubts", icon: MessageCircle },
  // { name: "Curriculum Gap Matrix", href: "/curriculum", icon: Map },
  // { name: "Industry Trends", href: "/trends", icon: TrendingUp },
  {name: "Student Matrix", href: "/students", icon: LayoutList},
  { name: "Company Rankings", href: "/rankings", icon: Building2 },
  { name: "Export Reports", href: "/reports", icon: Send },
];

export function SidebarContent() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
          NST
        </div>
        <div>
          <h1 className="text-base font-bold leading-tight text-gray-900">PlacePrep</h1>
          <p className="text-xs font-medium text-gray-500">Faculty Portal</p>
        </div>
      </div>

      {/* User Info */}
      <div className="mx-3 mb-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
          PS
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">Prof. Sharma</p>
          <p className="truncate text-xs text-gray-500">Computer Science Dept.</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-200 p-3 space-y-1">
        <button
          onClick={() => {
            document.cookie = "faculty_authed=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.href = "/login";
          }}
          className="w-full group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <LogOut className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
          Logout
        </button>
        <p className="px-3 py-2 text-xs font-medium text-gray-400">NST Interview Intelligence</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <div className="hidden border-r border-gray-200 lg:fixed lg:inset-y-0 lg:flex lg:w-[var(--sidebar-width)] lg:flex-col z-50">
      <SidebarContent />
    </div>
  );
}
