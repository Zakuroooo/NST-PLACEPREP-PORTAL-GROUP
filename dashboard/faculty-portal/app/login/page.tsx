"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, BookOpenCheck, MessageCircle, Calendar, BarChart3 } from "lucide-react";

// Faculty portal calls the student portal login endpoint (shared cookie domain)
const STUDENT_LOGIN_URL =
  process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL || "http://localhost:3000";

// Dedicated env var for Admin Portal — avoids fragile string replacement on the URL
const ADMIN_PORTAL_URL =
  process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL || "http://localhost:3002";

export default function FacultyLoginPage() {
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

      if (data.data.role !== "faculty") {
        setError("This portal is for faculty only. Use the correct portal.");
        return;
      }

      router.push("/");
    } catch {
      setError("Unable to connect. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#070b18]">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden p-14">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1a35] via-[#091228] to-[#070b18]" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="bg-indigo-600 rounded-lg px-2.5 py-1.5 text-white font-bold text-sm">NST</div>
          <span className="font-bold text-white text-lg">PlacePrep</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Faculty
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                Command Center
              </span>
            </h1>
            <p className="text-gray-400 text-base leading-relaxed max-w-xs">
              Mentor students, resolve doubts in real-time, and track
              placement readiness across your cohort.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: MessageCircle, label: "Doubt Resolution", sub: "Answer student queries instantly" },
              { icon: Calendar, label: "1:1 Sessions", sub: "Jitsi Meet links auto-generated" },
              { icon: BarChart3, label: "Student Analytics", sub: "XP, streak, and prep score data" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-indigo-400" />
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
          <p className="text-gray-600 text-xs">Newton School of Technology · Faculty Access</p>
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="bg-indigo-600 rounded-lg px-2.5 py-1.5 text-white font-bold text-sm">NST</div>
          <span className="font-bold text-white text-lg">PlacePrep</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center">
                <BookOpenCheck className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-xs font-semibold text-indigo-400 tracking-widest uppercase">
                Faculty Portal
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1.5">Faculty Sign In</h2>
            <p className="text-gray-500 text-sm">Access your academic dashboard</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="faculty-email" className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email</label>
              <input
                id="faculty-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="faculty@newtonschool.co"
                required
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500/60 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="faculty-password" className="text-xs font-medium text-gray-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  id="faculty-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 pr-11 rounded-xl text-sm focus:outline-none focus:border-indigo-500/60 transition-all"
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
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In to Faculty Portal"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-center text-xs text-gray-600">
              Faculty access only. Contact admin if you cannot log in.
            </p>
          </div>

          <div className="mt-6 flex justify-center gap-4 text-xs text-gray-700">
            <a href={`${STUDENT_LOGIN_URL}/login`} className="hover:text-gray-500 transition-colors">
              Student Portal
            </a>
            <span>·</span>
            <a href={`${ADMIN_PORTAL_URL}/login`} className="hover:text-gray-500 transition-colors">
              Admin Portal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
