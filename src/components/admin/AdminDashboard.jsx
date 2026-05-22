"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

import AdminSidebar from "./AdminSidebar";
import DashboardOverview from "./DashboardOverview";
import UsersSection from "./UsersSection";
import ClientsSection from "./ClientsSection";
import TeamsSection from "./TeamsSection";
import CountersSection from "./CountersSection";
import BillsSection from "./BillsSection";
import ReportsSection from "./ReportsSection";
import { FaBars } from "react-icons/fa";

const API_ROOT = process.env.NEXT_PUBLIC_API_URL || "";
const LOGOUT_API = `${API_ROOT}/api/auth/logout`;

function getAuthHeaders(extra = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export default function AdminDashboard() {
  const router = useRouter();

  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      try {
        await fetch(LOGOUT_API, {
          method: "POST",
          credentials: "include",
          headers: {
            ...getAuthHeaders(),
          },
        });
      } catch {
        // Local logout will still work even if logout API is missing.
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      toast.success("Logged out successfully.");

      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error(error?.message || "Logout failed.");
    } finally {
      setLoggingOut(false);
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "users":
        return <UsersSection />;

      case "clients":
        return <ClientsSection />;

      case "teams":
        return <TeamsSection />;

      case "counters":
        return <CountersSection />;

      case "bills":
        return <BillsSection />;

      case "reports":
        return <ReportsSection />;

      case "dashboard":
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "16px",
            background: "#111827",
            color: "#ffffff",
            padding: "14px 16px",
            fontSize: "14px",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#ffffff",
            },
          },
        }}
      />

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      <AdminSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      <div className="lg:pl-72">
        <div className="px-4 pt-4 sm:px-6 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FaBars />
          </button>
        </div>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
}