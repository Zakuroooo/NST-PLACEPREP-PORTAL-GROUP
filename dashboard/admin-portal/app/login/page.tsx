"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Shield, Users, BarChart3, Settings } from "lucide-react";

const STUDENT_LOGIN_URL =
  process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL || "http://localhost:3000";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${STUDENT_LOGIN_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed. Please check your credentials.");
        return;
      }

      if (data.data.role !== "admin") {
        setError("Access denied. This portal is for administrators only.");
        return;
      }

      router.push("/overview");
    } catch {
      setError("Unable to connect. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#06080f]">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden p-14">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c1020] via-[#080d1c] to-[#06080f]" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="bg-emerald-600 rounded-lg px-2.5 py-1.5 text-white font-bold text-sm">NST</div>
          <span className="font-bold text-white text-lg">PlacePrep</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Admin
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                Control Center
              </span>
            </h1>
            <p className="text-gray-400 text-base leading-relaxed max-w-xs">
              Full platform visibility. Manage students, faculty, sessions,
              and placement analytics from a single dashboard.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Users, label: "User Management", sub: "Create and manage all accounts" },
              { icon: BarChart3, label: "Platform Analytics", sub: "Curriculum gap analysis & KPIs" },
              { icon: Settings, label: "System Control", sub: "Sessions, notifications, resets" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{label}</div>
                  <div className="text-gray-500 text-xs">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-gray-600 text-xs">Newton School of Technology · Admin Access</p>
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="bg-emerald-600 rounded-lg px-2.5 py-1.5 text-white font-bold text-sm">NST</div>
          <span className="font-bold text-white text-lg">PlacePrep Admin</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-emerald-400 tracking-widest uppercase">
                Admin Portal
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1.5">Secure Sign In</h2>
            <p className="text-gray-500 text-sm">Access the PlacePrep management console</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@newtonschool.co"
                required
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-emerald-500/60 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 pr-11 rounded-xl text-sm focus:outline-none focus:border-emerald-500/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Sign In to Admin Portal
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-center text-xs text-gray-600">
              Restricted to authorized administrators only.
              <br />
              Contact{" "}
              <span className="text-gray-500 font-medium">tech@newtonschool.co</span>{" "}
              for access.
            </p>
          </div>

          <div className="mt-6 flex justify-center gap-4 text-xs text-gray-700">
            <a href={`${STUDENT_LOGIN_URL}/login`} className="hover:text-gray-500 transition-colors">
              Student Portal
            </a>
            <span>·</span>
            <a href={`${process.env.NEXT_PUBLIC_FACULTY_PORTAL_URL || "http://localhost:3001"}/login`} className="hover:text-gray-500 transition-colors">
              Faculty Portal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
