"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSignInAlt,
} from "react-icons/fa";
import { MdOutlineReceiptLong } from "react-icons/md";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (message.text) {
      setMessage({
        type: "",
        text: "",
      });
    }
  };

  const getRedirectRouteByRole = async (fallbackUser = null) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    try {
      const meRes = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const meData = await meRes.json();

      if (!meRes.ok || !meData?.success) {
        if (fallbackUser?.role === "admin") return "/admin";
        if (fallbackUser?.role === "client") return "/client-dashboard";
        if (fallbackUser?.role === "team") return "/team-dashboard";
        return "/dashboard";
      }

      const user = meData?.data?.user;

      if (user?.role === "admin") {
        return "/admin";
      }

      if (user?.role === "client") {
        return "/client-dashboard";
      }

      if (user?.role === "team") {
        return "/team-dashboard";
      }

      return "/dashboard";
    } catch {
      if (fallbackUser?.role === "admin") return "/admin";
      if (fallbackUser?.role === "client") return "/client-dashboard";
      if (fallbackUser?.role === "team") return "/team-dashboard";
      return "/dashboard";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage({
      type: "",
      text: "",
    });

    if (!formData.identifier.trim() || !formData.password) {
      setMessage({
        type: "error",
        text: "Email/username and password are required.",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          identifier: formData.identifier.trim(),
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setMessage({
          type: "error",
          text: data?.message || "Login failed.",
        });
        return;
      }

      const token =
        data?.data?.token ||
        data?.token ||
        data?.data?.accessToken ||
        data?.accessToken;

      if (token && typeof window !== "undefined") {
        localStorage.setItem("token", token);
      }

      const loginUser = data?.data?.user || null;
      const redirectRoute = await getRedirectRouteByRole(loginUser);

      setMessage({
        type: "success",
        text: "Login successful. Redirecting...",
      });

      setTimeout(() => {
        router.push(redirectRoute);
        router.refresh();
      }, 700);
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.message || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
        {/* Left Side */}
        <section className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-lg">
              <MdOutlineReceiptLong className="text-4xl text-emerald-200" />
            </div>

            <h1 className="text-4xl font-bold leading-tight">
              Hasil Billing
              <span className="block text-emerald-300">Management System</span>
            </h1>

            <p className="mt-5 max-w-md text-base leading-7 text-white/75">
              Secure login for Admin, Client, and Team members. Manage hasil
              counters, teams, and billing from one platform.
            </p>
          </div>

          <div className="relative z-10 rounded-2xl border border-white/10 bg-white/10 p-5">
            <p className="text-sm text-white/70">System Access</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-sm">
                Admin
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-sm">
                Client
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-sm">
                Team
              </span>
            </div>
          </div>
        </section>

        {/* Right Side */}
        <section className="bg-white px-6 py-10 sm:px-10 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="lg:hidden mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
                <MdOutlineReceiptLong className="text-2xl text-emerald-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Hasil Billing
                </h2>
                <p className="text-sm text-slate-500">Management System</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Welcome back
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Login using your email or username to continue.
              </p>
            </div>

            {message.text && (
              <div
                className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
                  message.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Identifier */}
              <div>
                <label
                  htmlFor="identifier"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email or Username
                </label>

                <div className="relative">
                  <FaUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    value={formData.identifier}
                    onChange={handleChange}
                    placeholder="Enter email or username"
                    autoComplete="username"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-14 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-emerald-700"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-700 font-semibold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <FaSignInAlt />
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm text-slate-600">
              Need to create the first admin?
              <Link
                href="/register"
                className="ml-1 font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                Register here
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}