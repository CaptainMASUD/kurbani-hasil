"use client";

import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  FaUsers,
  FaUserTie,
  FaUserCog,
  FaFileInvoiceDollar,
  FaChartLine,
  FaCashRegister,
  FaSyncAlt,
  FaWallet,
  FaCalendarDay,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaTimesCircle,
  FaArrowRight,
  FaReceipt,
  FaCrown,
  FaUserFriends,
} from "react-icons/fa";
import { MdOutlineReceiptLong } from "react-icons/md";

const API_ROOT = process.env.NEXT_PUBLIC_API_URL || "";
const OVERVIEW_API = `${API_ROOT}/api/admin/overview`;

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getAuthHeaders(extra = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function requestJSON(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

function formatMoney(value = 0) {
  const number = Number(value || 0);

  const formatted = new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number);

  return `Tk ${formatted}`;
}

function formatNumber(value = 0) {
  return new Intl.NumberFormat("en-BD").format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
  }).format(date);
}

function capitalize(value = "") {
  const text = String(value || "");
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "—";
}

function getAnimalLabel(value = "") {
  const labels = {
    cow: "গরু",
    goat: "ছাগল",
    buffalo: "মহিষ",
    sheep: "ভেড়া",
    camel: "উট",
    other: "অন্যান্য",
  };

  return labels[value] || capitalize(value);
}

function getPaymentLabel(value = "") {
  const labels = {
    cash: "ক্যাশ",
    bkash: "বিকাশ",
    nagad: "নগদ টাকা",
    rocket: "রকেট",
    bank: "ব্যাংক",
    card: "কার্ড",
    other: "অন্যান্য",
  };

  return labels[value] || capitalize(value);
}

function getInitials(name = "") {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const card =
  "rounded-[26px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.055)]";

const softButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60";

function StatusBadge({ status }) {
  const current = String(status || "").toLowerCase();

  const styles =
    current === "paid" || current === "active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : current === "cancelled" || current === "suspended"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black",
        styles
      )}
    >
      {capitalize(current)}
    </span>
  );
}

function StatCard({ title, value, subtitle, icon, accent }) {
  return (
    <div className={cn(card, "p-4 sm:p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-xs">
            {title}
          </p>

          <h3 className="mt-2 truncate text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
            {value}
          </h3>

          {subtitle && (
            <p className="mt-1 truncate text-xs font-semibold text-slate-500 sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] text-lg sm:h-14 sm:w-14 sm:text-xl",
            accent
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-black tracking-tight text-slate-950 sm:text-lg">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
        )}
      </div>

      {action}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className={cn(card, "w-full max-w-md p-8 text-center")}>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[24px] bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
          <FaSyncAlt className="animate-spin text-2xl" />
        </div>

        <h2 className="text-xl font-black text-slate-950">
          Loading Overview
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Fetching users, bills, collections, and reports.
        </p>
      </div>
    </div>
  );
}

function EmptyMini({ title }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
      <p className="text-sm font-bold text-slate-500">{title}</p>
    </div>
  );
}

function ReportList({ rows, labelFormatter = (value) => value }) {
  if (!rows?.length) {
    return <EmptyMini title="No data found" />;
  }

  const maxAmount = Math.max(...rows.map((row) => Number(row.hasilAmount || 0)), 1);

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const percent = Math.min(
          100,
          Math.round((Number(row.hasilAmount || 0) / maxAmount) * 100)
        );

        return (
          <div
            key={String(row.key)}
            className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">
                  {labelFormatter(row.key)}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {formatNumber(row.count)} bills
                </p>
              </div>

              <p className="shrink-0 text-sm font-black text-emerald-700">
                {formatMoney(row.hasilAmount)}
              </p>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecentBillsTable({ bills }) {
  if (!bills?.length) {
    return <EmptyMini title="No recent bills found" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
            <th className="px-5 py-4">Bill</th>
            <th className="px-5 py-4">Buyer</th>
            <th className="px-5 py-4">Client</th>
            <th className="px-5 py-4">Created By</th>
            <th className="px-5 py-4">Payment</th>
            <th className="px-5 py-4">Hasil</th>
            <th className="px-5 py-4">Date</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {bills.map((bill) => (
            <tr
              key={bill.id || bill.billNo}
              className="transition hover:bg-emerald-50/40"
            >
              <td className="px-5 py-4 align-top">
                <p className="text-sm font-black text-slate-950">
                  {bill.billNo}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {getAnimalLabel(bill.animalType)}
                </p>
              </td>

              <td className="px-5 py-4 align-top">
                <p className="text-sm font-bold text-slate-900">
                  {bill.buyerName || "—"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {bill.buyerPhone || "No phone"}
                </p>
              </td>

              <td className="px-5 py-4 align-top">
                <p className="text-sm font-bold text-slate-900">
                  {bill.client?.name || "—"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  @{bill.client?.username || "—"}
                </p>
              </td>

              <td className="px-5 py-4 align-top">
                <p className="text-sm font-bold text-slate-900">
                  {bill.createdBy?.name || "—"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {bill.counterNumber
                    ? `Counter ${bill.counterNumber}`
                    : capitalize(bill.createdBy?.role)}
                </p>
              </td>

              <td className="px-5 py-4 align-top">
                <div className="space-y-2">
                  <StatusBadge status={bill.status} />
                  <p className="text-xs font-bold text-slate-500">
                    {getPaymentLabel(bill.paymentMethod)}
                  </p>
                </div>
              </td>

              <td className="px-5 py-4 align-top">
                <p className="text-sm font-black text-emerald-700">
                  {formatMoney(bill.hasilAmount)}
                </p>
              </td>

              <td className="px-5 py-4 align-top">
                <p className="text-sm font-semibold text-slate-600">
                  {formatDate(bill.issuedAt || bill.createdAt)}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PeopleList({ title, items, type }) {
  return (
    <div className={cn(card, "p-4 sm:p-6")}>
      <SectionHeader title={title} subtitle="Latest records" />

      {!items?.length ? (
        <EmptyMini title="No records found" />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-sm font-black text-white">
                  {getInitials(item.name)}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">
                    {item.name || "—"}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                    {type === "team"
                      ? item.client?.name || "No client"
                      : item.hasilLocation || item.phone || "No details"}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <StatusBadge status={item.status || "active"} />
                {type === "team" && (
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    Counter {item.counterNumber || "—"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopClientList({ clients }) {
  return (
    <div className={cn(card, "p-4 sm:p-6")}>
      <SectionHeader
        title="Top Clients"
        subtitle="Highest hasil collection"
      />

      {!clients?.length ? (
        <EmptyMini title="No client data found" />
      ) : (
        <div className="space-y-3">
          {clients.map((item, index) => (
            <div
              key={item.client?.id || index}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                    {index + 1}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">
                      {item.client?.name || "Unknown Client"}
                    </p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                      {item.billCount || 0} bills •{" "}
                      {item.client?.hasilLocation || "No location"}
                    </p>
                  </div>
                </div>

                <p className="shrink-0 text-sm font-black text-emerald-700">
                  {formatMoney(item.hasilAmount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardOverview() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchOverview(showToast = false) {
    try {
      const data = await requestJSON(OVERVIEW_API, {
        method: "GET",
      });

      setOverview(data.data || null);

      if (showToast) {
        toast.success("Dashboard overview refreshed.");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to fetch overview.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchOverview(false);
  }, []);

  const stats = useMemo(() => {
    return {
      totalUsers: overview?.users?.total || 0,
      totalClients: overview?.users?.clients || 0,
      totalTeams: overview?.users?.teams || 0,
      totalBills: overview?.bills?.total || 0,
      todayBills: overview?.bills?.today || 0,
      monthlyBills: overview?.bills?.thisMonth || 0,
      totalHasil: overview?.money?.totalHasilAmount || 0,
      todayHasil: overview?.money?.todayHasilAmount || 0,
      monthlyHasil: overview?.money?.monthlyHasilAmount || 0,
      paidBills: overview?.bills?.paid || 0,
      unpaidBills: overview?.bills?.unpaid || 0,
      cancelledBills: overview?.bills?.cancelled || 0,
    };
  }, [overview]);

  function handleRefresh() {
    setRefreshing(true);
    fetchOverview(true);
  }

  if (loading) {
    return (
      <>
        <Toaster position="top-right" />
        <LoadingState />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />

      <div className="space-y-5 sm:space-y-6">
        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-slate-950 shadow-[0_22px_60px_rgba(15,23,42,0.16)]">
          <div className="relative p-5 text-white sm:p-8">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute bottom-0 right-20 h-28 w-28 rounded-t-[60px] bg-cyan-400/10" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100 sm:text-xs">
                  <MdOutlineReceiptLong className="text-base" />
                  Admin Control Center
                </div>

                <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
                  Dashboard Overview
                </h1>

                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/65 sm:text-base">
                  Monitor clients, teams, counters, bills, payment status, and
                  hasil collection from one clean admin dashboard.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <FaSyncAlt className={cn(refreshing && "animate-spin")} />
                Refresh Data
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            title="Total Hasil"
            value={formatMoney(stats.totalHasil)}
            subtitle="All collections"
            icon={<FaWallet />}
            accent="bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
          />

          <StatCard
            title="Today Hasil"
            value={formatMoney(stats.todayHasil)}
            subtitle={`${formatNumber(stats.todayBills)} bills today`}
            icon={<FaCalendarDay />}
            accent="bg-emerald-100 text-emerald-700"
          />

          <StatCard
            title="Monthly Hasil"
            value={formatMoney(stats.monthlyHasil)}
            subtitle={`${formatNumber(stats.monthlyBills)} bills this month`}
            icon={<FaCalendarAlt />}
            accent="bg-blue-100 text-blue-700"
          />

          <StatCard
            title="Total Bills"
            value={formatNumber(stats.totalBills)}
            subtitle="All active bills"
            icon={<FaFileInvoiceDollar />}
            accent="bg-violet-100 text-violet-700"
          />
        </section>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            title="Total Users"
            value={formatNumber(stats.totalUsers)}
            subtitle="Admin + clients + teams"
            icon={<FaUsers />}
            accent="bg-slate-950 text-white"
          />

          <StatCard
            title="Clients"
            value={formatNumber(stats.totalClients)}
            subtitle="Client accounts"
            icon={<FaUserTie />}
            accent="bg-cyan-100 text-cyan-700"
          />

          <StatCard
            title="Teams"
            value={formatNumber(stats.totalTeams)}
            subtitle="Team accounts"
            icon={<FaUserFriends />}
            accent="bg-amber-100 text-amber-700"
          />

          <StatCard
            title="Admins"
            value={formatNumber(overview?.users?.admins || 0)}
            subtitle="System admins"
            icon={<FaUserCog />}
            accent="bg-rose-100 text-rose-700"
          />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className={cn(card, "p-4 sm:p-6")}>
            <SectionHeader
              title="Bill Status"
              subtitle="Paid, unpaid and cancelled"
            />

            <div className="grid grid-cols-1 gap-3">
              <StatCard
                title="Paid"
                value={formatNumber(stats.paidBills)}
                subtitle={formatMoney(overview?.money?.paidHasilAmount || 0)}
                icon={<FaCheckCircle />}
                accent="bg-emerald-100 text-emerald-700"
              />

              <StatCard
                title="Unpaid"
                value={formatNumber(stats.unpaidBills)}
                subtitle={formatMoney(overview?.money?.unpaidHasilAmount || 0)}
                icon={<FaExclamationCircle />}
                accent="bg-amber-100 text-amber-700"
              />

              <StatCard
                title="Cancelled"
                value={formatNumber(stats.cancelledBills)}
                subtitle="Cancelled bills"
                icon={<FaTimesCircle />}
                accent="bg-red-100 text-red-700"
              />
            </div>
          </div>

          <div className={cn(card, "p-4 sm:p-6 xl:col-span-2")}>
            <SectionHeader
              title="Payment Method Report"
              subtitle="Collection by payment type"
            />

            <ReportList
              rows={overview?.bills?.byPaymentMethod || []}
              labelFormatter={getPaymentLabel}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className={cn(card, "p-4 sm:p-6")}>
            <SectionHeader
              title="Animal Type Report"
              subtitle="Bills by animal type"
            />

            <ReportList
              rows={overview?.bills?.byAnimalType || []}
              labelFormatter={getAnimalLabel}
            />
          </div>

          <div className={cn(card, "p-4 sm:p-6")}>
            <SectionHeader
              title="Counter Report"
              subtitle="Counter-wise hasil"
            />

            <ReportList
              rows={(overview?.bills?.byCounter || []).map((item) => ({
                key: item.counterNumber
                  ? `Counter ${item.counterNumber}`
                  : "No Counter",
                count: item.count,
                hasilAmount: item.hasilAmount,
                totalAmount: item.totalAmount,
              }))}
            />
          </div>

          <TopClientList clients={overview?.topClients || []} />
        </section>

        <section className={cn(card, "overflow-hidden")}>
          <div className="border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
            <SectionHeader
              title="Recent Bills"
              subtitle="Latest hasil bills created in the system"
              action={
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                  <FaReceipt />
                  Latest 10
                </span>
              }
            />
          </div>

          <RecentBillsTable bills={overview?.recentBills || []} />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <PeopleList
            title="Recent Clients"
            items={overview?.recentClients || []}
            type="client"
          />

          <PeopleList
            title="Recent Teams"
            items={overview?.recentTeams || []}
            type="team"
          />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className={cn(card, "p-4 sm:p-6")}>
            <SectionHeader
              title="Top Creators"
              subtitle="Team/client members by hasil collection"
            />

            {!overview?.topCreators?.length ? (
              <EmptyMini title="No creator data found" />
            ) : (
              <div className="space-y-3">
                {overview.topCreators.map((item, index) => (
                  <div
                    key={item.createdBy?.id || index}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                          {index === 0 ? <FaCrown /> : index + 1}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950">
                            {item.createdBy?.name || "Unknown"}
                          </p>
                          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                            {capitalize(item.createdBy?.role)} •{" "}
                            {item.billCount || 0} bills
                          </p>
                        </div>
                      </div>

                      <p className="shrink-0 text-sm font-black text-emerald-700">
                        {formatMoney(item.hasilAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={cn(card, "p-4 sm:p-6")}>
            <SectionHeader
              title="System Summary"
              subtitle="Quick health overview"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SummaryTile
                icon={<FaCheckCircle />}
                title="Active Users"
                value={overview?.users?.active || 0}
                color="text-emerald-700 bg-emerald-50 border-emerald-100"
              />

              <SummaryTile
                icon={<FaExclamationCircle />}
                title="Inactive Users"
                value={overview?.users?.inactive || 0}
                color="text-amber-700 bg-amber-50 border-amber-100"
              />

              <SummaryTile
                icon={<FaCashRegister />}
                title="Total Counters"
                value={overview?.bills?.byCounter?.length || 0}
                color="text-violet-700 bg-violet-50 border-violet-100"
              />

              <SummaryTile
                icon={<FaChartLine />}
                title="Animal Types"
                value={overview?.bills?.byAnimalType?.length || 0}
                color="text-blue-700 bg-blue-50 border-blue-100"
              />
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-emerald-900">
                    Total Collection
                  </p>
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    Same as hasil collection in your bill logic
                  </p>
                </div>

                <FaArrowRight className="shrink-0 text-emerald-700" />
              </div>

              <p className="mt-4 text-2xl font-black text-emerald-700">
                {formatMoney(overview?.money?.totalCollectionAmount || 0)}
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function SummaryTile({ icon, title, value, color }) {
  return (
    <div className={cn("rounded-2xl border p-4", color)}>
      <div className="mb-3 text-lg">{icon}</div>
      <p className="text-xs font-black uppercase tracking-[0.14em] opacity-70">
        {title}
      </p>
      <p className="mt-2 text-xl font-black">{formatNumber(value)}</p>
    </div>
  );
}