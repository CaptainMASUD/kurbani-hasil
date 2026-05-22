"use client";

import {
  FaTimes,
  FaUsers,
  FaUserTie,
  FaCashRegister,
  FaFileInvoiceDollar,
  FaChartLine,
  FaMapMarkerAlt,
  FaChevronRight,
  FaSignOutAlt,
  FaUserCog,
  FaSpinner,
} from "react-icons/fa";
import { MdDashboard, MdOutlineReceiptLong } from "react-icons/md";

const sidebarItems = [
  {
    key: "dashboard",
    name: "Dashboard",
    icon: MdDashboard,
  },
  {
    key: "users",
    name: "Users",
    icon: FaUserCog,
  },
  {
    key: "clients",
    name: "Clients",
    icon: FaUserTie,
  },
  {
    key: "teams",
    name: "Teams",
    icon: FaUsers,
  },
  {
    key: "counters",
    name: "Counters",
    icon: FaCashRegister,
  },
  {
    key: "bills",
    name: "Hasil Bills",
    icon: FaFileInvoiceDollar,
  },
  {
    key: "reports",
    name: "Reports",
    icon: FaChartLine,
  },
];

export default function AdminSidebar({
  activeSection,
  setActiveSection,
  sidebarOpen,
  setSidebarOpen,
  onLogout,
  loggingOut = false,
}) {
  const handleSectionChange = (key) => {
    setActiveSection(key);
    setSidebarOpen(false);
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen w-72 transform flex-col border-r border-white/10 bg-slate-950 text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-24 items-center justify-between border-b border-white/10 px-6">
        <button
          type="button"
          onClick={() => handleSectionChange("dashboard")}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
            <MdOutlineReceiptLong className="text-3xl" />
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-wide">Hasil Admin</h1>
            <p className="text-xs text-slate-400">Billing Dashboard</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
        >
          <FaTimes />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Main Menu
        </p>

        <div className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleSectionChange(item.key)}
                className={`group flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left transition ${
                  active
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="text-lg" />
                  <span className="text-sm font-semibold">{item.name}</span>
                </div>

                <FaChevronRight
                  className={`text-xs transition ${
                    active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
              <FaMapMarkerAlt />
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                Live Locations
              </p>
              <p className="text-xs text-slate-400">
                24 hasil points active
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSectionChange("clients")}
            className="mt-4 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            View Locations
          </button>
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-4 rounded-2xl bg-white/5 p-4">
          <p className="text-xs text-slate-400">Logged in as</p>
          <p className="mt-1 text-sm font-semibold text-white">
            System Admin
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loggingOut ? (
            <>
              <FaSpinner className="animate-spin" />
              Logging out...
            </>
          ) : (
            <>
              <FaSignOutAlt />
              Logout
            </>
          )}
        </button>
      </div>
    </aside>
  );
}