"use client";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { NavbarProvider } from "@/lib/navbar-context";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/hooks";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: profile, isLoading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && profile && profile.onboardingComplete === false) {
      router.push("/onboarding/step1");
    }
  }, [profile, isLoading, router]);

  if (isLoading || (profile && profile.onboardingComplete === false)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <NavbarProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Sidebar />
        <main className="min-h-screen bg-gray-50 lg:ml-[216px] pt-14 transition-all duration-200">
          <div className="px-4 lg:px-6 py-6">{children}</div>
        </main>
      </div>
    </NavbarProvider>
  );
}
