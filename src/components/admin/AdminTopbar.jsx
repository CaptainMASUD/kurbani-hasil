"use client";

import { FaBars, FaBell, FaSearch } from "react-icons/fa";

export default function AdminTopbar({ title, setSidebarOpen }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="flex h-24 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
          >
            <FaBars />
          </button>

          <div>
            <p className="text-sm font-medium text-emerald-700">
              Admin Panel
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden min-w-[280px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex">
            <FaSearch className="text-slate-400" />
            <input
              type="text"
              placeholder="Search here..."
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <button
            type="button"
            className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FaBell />
            <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </button>

          <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 font-bold text-emerald-700">
              A
            </div>

            <div className="pr-2">
              <p className="text-sm font-semibold text-slate-900">Admin</p>
              <p className="text-xs text-slate-500">Super Control</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}