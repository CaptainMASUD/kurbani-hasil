"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiDollarSign,
  FiEye,
  FiFileText,
  FiGrid,
  FiHash,
  FiHome,
  FiInfo,
  FiLoader,
  FiLogOut,
  FiMail,
  FiPhone,
  FiPieChart,
  FiPlus,
  FiRefreshCcw,
  FiSearch,
  FiShield,
  FiShoppingBag,
  FiSlash,
  FiTag,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";

/* ==========================================================================
   API CONFIG
   ========================================================================== */

const API_ROOT = process.env.NEXT_PUBLIC_API_URL || "";

const BILLS_API = `${API_ROOT}/api/hasil-bills`;
const ME_API = `${API_ROOT}/api/auth/me`;
const CLIENT_TEAM_API = `${API_ROOT}/api/client/team`;
const LOGOUT_API = `${API_ROOT}/api/auth/logout`;

const ANIMAL_TYPES = ["cow", "goat", "buffalo", "sheep", "camel", "other"];

const ANIMAL_TYPE_LABELS = {
  cow: "গরু",
  goat: "ছাগল",
  buffalo: "মহিষ",
  sheep: "ভেড়া",
  camel: "উট",
  other: "অন্যান্য",
};

const CALCULATION_TYPES = ["percentage", "fixed"];
const BILL_STATUSES = ["paid", "unpaid", "cancelled"];

const PAYMENT_METHODS = [
  "cash",
  "bkash",
  "nagad",
  "rocket",
  "bank",
  "card",
  "other",
];

/* ==========================================================================
   FORM DEFAULTS
   ========================================================================== */

function getTodayDateInputValue() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function createEmptyBillForm() {
  return {
    buyerName: "",
    buyerPhone: "",
    animalType: "cow",
    animalPrice: "",
    hasilCalculationType: "fixed",
    hasilRatePercent: "",
    hasilFixedAmount: "",
    status: "paid",
    paymentMethod: "nagad",
    issuedDate: getTodayDateInputValue(),
  };
}

/* ==========================================================================
   STYLE HELPERS
   ========================================================================== */

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const pageShell =
  "min-h-screen bg-[#F6F8F7] px-3 py-4 text-neutral-900 sm:px-5 sm:py-6 lg:px-10 lg:py-8";

const card =
  "rounded-[24px] border border-neutral-200/80 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.045)] sm:rounded-[28px]";

const buttonBase =
  "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:px-4";

const buttonPrimary =
  "bg-[#00BC7D] text-white hover:bg-[#00A86F] shadow-[0_12px_24px_rgba(0,188,125,0.22)]";

const buttonSoft =
  "border border-neutral-200 bg-white text-neutral-700 hover:border-[#00BC7D]/40 hover:bg-[#00BC7D]/[0.05] hover:text-[#008E60]";

const buttonDanger =
  "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800";

const input =
  "h-11 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#00BC7D] focus:bg-white focus:ring-4 focus:ring-[#00BC7D]/10 sm:h-12";

const label = "mb-2 block text-sm font-bold leading-6 text-neutral-700";

/* ==========================================================================
   GENERAL HELPERS
   ========================================================================== */

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

function getInitials(name = "") {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatMoney(value = 0) {
  const number = Number(value || 0);

  const formatted = new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number);

  return `Tk ${formatted}`;
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
  return ANIMAL_TYPE_LABELS[value] || "—";
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

function calculatePreview(form) {
  const animalPrice = Math.max(0, Number(form.animalPrice || 0));
  const percentage = Math.max(0, Number(form.hasilRatePercent || 0));
  const fixedAmount = Math.max(0, Number(form.hasilFixedAmount || 0));

  let hasilAmount = 0;

  if (form.hasilCalculationType === "percentage") {
    hasilAmount = (animalPrice * percentage) / 100;
  }

  if (form.hasilCalculationType === "fixed") {
    hasilAmount = fixedAmount;
  }

  hasilAmount = Number(hasilAmount.toFixed(2));

  return {
    animalPrice,
    hasilAmount,
    totalAmount: hasilAmount,
  };
}

function getBillId(bill) {
  return bill?.id || bill?._id || bill?.billNo;
}

/* ==========================================================================
   SMALL UI COMPONENTS
   ========================================================================== */

function Field({ title, children }) {
  return (
    <div>
      <label className={label}>{title}</label>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const current = String(status || "").toLowerCase();

  const styles =
    current === "paid"
      ? "border-[#00BC7D]/25 bg-[#00BC7D]/10 text-[#008E60]"
      : current === "cancelled"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  const dot =
    current === "paid"
      ? "bg-[#00BC7D]"
      : current === "cancelled"
        ? "bg-rose-500"
        : "bg-amber-500";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold sm:text-xs",
        styles
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {capitalize(current)}
    </span>
  );
}

function SoftBadge({ children, icon, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold sm:text-xs",
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}

function CenterStateCard({ icon, title, description }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F8F7] px-4">
      <div className={cn(card, "w-full max-w-md p-6 text-center sm:p-8")}>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#00BC7D] text-white shadow-[0_14px_32px_rgba(0,188,125,0.25)]">
          {icon}
        </div>

        <h1 className="text-xl font-bold tracking-tight text-neutral-950">
          {title}
        </h1>

        {description && (
          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, accent }) {
  return (
    <div className={cn(card, "p-4 sm:p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 sm:text-xs">
            {title}
          </p>

          <h3 className="mt-2 truncate text-lg font-bold tracking-tight text-neutral-950 sm:text-2xl">
            {value}
          </h3>

          {subtitle && (
            <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl sm:h-14 sm:w-14 sm:rounded-[22px]",
            accent
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function LoadingCard({ text = "Loading..." }) {
  return (
    <div className={cn(card, "p-8 text-center")}>
      <div className="inline-flex items-center gap-3 text-sm font-semibold text-neutral-500">
        <FiLoader className="h-5 w-5 animate-spin text-[#00BC7D]" />
        {text}
      </div>
    </div>
  );
}

function EmptyCard({ icon, title, description }) {
  return (
    <div className={cn(card, "p-8 text-center")}>
      <div className="mx-auto flex max-w-sm flex-col items-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#00BC7D]/10 text-[#008E60]">
          {icon}
        </div>

        <h3 className="text-base font-bold text-neutral-950">{title}</h3>

        {description && (
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   MODAL
   ========================================================================== */

function ModalShell({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidthClass = "max-w-5xl",
}) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-2 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.99 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative w-full overflow-hidden rounded-t-[28px] border border-neutral-200 bg-white shadow-2xl sm:rounded-[30px]",
              maxWidthClass
            )}
          >
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-100 bg-white/95 px-4 py-4 backdrop-blur-md sm:px-6 sm:py-5">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#00BC7D] text-white shadow-[0_12px_24px_rgba(0,188,125,0.22)] sm:h-12 sm:w-12">
                  {icon}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold tracking-tight text-neutral-950 sm:text-lg">
                    {title}
                  </h2>

                  {subtitle && (
                    <p className="mt-0.5 truncate text-xs text-neutral-500 sm:text-sm">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500 transition hover:bg-[#00BC7D]/10 hover:text-[#008E60]"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-4 py-4 sm:max-h-[calc(100vh-13rem)] sm:px-6 sm:py-5">
              {children}
            </div>

            {footer && (
              <div className="sticky bottom-0 z-20 border-t border-neutral-100 bg-white/95 px-4 py-4 backdrop-blur-md sm:px-6 sm:py-5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   TAB BAR
   ========================================================================== */

function ClientTabBar({ activeTab, onChange, counts }) {
  const tabs = [
    {
      id: "overview",
      label: "Overview",
      short: "Home",
      icon: <FiHome className="h-4 w-4" />,
    },
    {
      id: "create",
      label: "New Bill",
      short: "New",
      icon: <FiPlus className="h-4 w-4" />,
    },
    {
      id: "bills",
      label: "Bills",
      short: "Bills",
      count: counts?.bills,
      icon: <FiFileText className="h-4 w-4" />,
    },
    {
      id: "team",
      label: "Team",
      short: "Team",
      count: counts?.team,
      icon: <FiUsers className="h-4 w-4" />,
    },
    {
      id: "reports",
      label: "Reports",
      short: "Reports",
      icon: <FiBarChart2 className="h-4 w-4" />,
    },
    {
      id: "profile",
      label: "Profile",
      short: "Profile",
      icon: <FiUser className="h-4 w-4" />,
    },
  ];

  return (
    <section className={cn(card, "sticky top-3 z-30 overflow-hidden p-2")}>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative flex min-w-[92px] items-center justify-center gap-2 rounded-[18px] px-3 py-3 text-xs font-bold transition sm:min-w-[130px] sm:rounded-[22px] sm:px-4 sm:text-sm",
                active
                  ? "bg-neutral-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)]"
                  : "bg-neutral-50 text-neutral-600 hover:bg-[#00BC7D]/[0.08] hover:text-[#008E60]"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl",
                  active
                    ? "bg-[#00BC7D] text-white"
                    : "bg-white text-[#008E60]"
                )}
              >
                {tab.icon}
              </span>

              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.short}</span>

              {tab.count !== undefined && (
                <span
                  className={cn(
                    "absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black",
                    active
                      ? "bg-white text-neutral-950"
                      : "bg-[#00BC7D] text-white"
                  )}
                >
                  {tab.count || 0}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ==========================================================================
   HERO WITH LOGOUT
   ========================================================================== */

function ClientHero({
  currentUser,
  summary,
  onCreate,
  onRefresh,
  refreshing,
  onLogout,
  loggingOut,
}) {
  return (
    <section className={cn(card, "overflow-hidden")}>
      <div className="relative p-5 sm:p-8">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-[70px] bg-[#00BC7D]/10" />
        <div className="absolute bottom-0 right-16 h-24 w-24 rounded-t-[60px] bg-blue-500/10" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#00BC7D]/20 bg-[#00BC7D]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#008E60] sm:text-xs">
              <FiShield className="h-3.5 w-3.5" />
              Client Control Center
            </div>

            <h1 className="text-2xl font-black tracking-tight text-neutral-950 sm:text-4xl">
              Hasil Client Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-neutral-500 sm:text-base">
              Manage bills, monitor counters, view team activity, and track
              hasil collections from one clean dashboard.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <SoftBadge
                icon={<FiUser className="h-3.5 w-3.5" />}
                className="border-[#00BC7D]/25 bg-[#00BC7D]/10 text-[#008E60]"
              >
                {currentUser?.name || "Client"}
              </SoftBadge>

              <SoftBadge
                icon={<FiGrid className="h-3.5 w-3.5" />}
                className="border-violet-200 bg-violet-50 text-violet-700"
              >
                {currentUser?.totalCounters || 0} Counters
              </SoftBadge>

              <SoftBadge
                icon={<FiUsers className="h-3.5 w-3.5" />}
                className="border-blue-200 bg-blue-50 text-blue-700"
              >
                {summary.totalTeamMembers || 0} Team Members
              </SoftBadge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex lg:shrink-0">
            <button
              onClick={onCreate}
              disabled={loggingOut}
              className={cn(buttonBase, buttonPrimary, "w-full sm:w-auto")}
            >
              <FiPlus className="h-4 w-4" />
              New Bill
            </button>

            <button
              onClick={onRefresh}
              disabled={refreshing || loggingOut}
              className={cn(buttonBase, buttonSoft, "w-full sm:w-auto")}
            >
              <FiRefreshCcw
                className={cn("h-4 w-4", refreshing && "animate-spin")}
              />
              Refresh
            </button>

            <button
              onClick={onLogout}
              disabled={loggingOut}
              className={cn(
                buttonBase,
                buttonDanger,
                "col-span-2 w-full sm:col-span-1 sm:w-auto"
              )}
            >
              {loggingOut ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin" />
                  Logging out
                </>
              ) : (
                <>
                  <FiLogOut className="h-4 w-4" />
                  Logout
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   ADD BILL
   ========================================================================== */

function AddBillTab({ currentUser, onCreated }) {
  const [form, setForm] = useState(createEmptyBillForm);
  const [submitting, setSubmitting] = useState(false);

  const preview = useMemo(() => calculatePreview(form), [form]);

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(createEmptyBillForm());
  }

  function buildPayload() {
    return {
      buyerName: form.buyerName.trim(),
      buyerPhone: form.buyerPhone.trim(),
      animalType: form.animalType,
      animalPrice: Number(form.animalPrice || 0),
      hasilCalculationType: form.hasilCalculationType,
      hasilRatePercent: Number(form.hasilRatePercent || 0),
      hasilFixedAmount: Number(form.hasilFixedAmount || 0),
      status: form.status,
      paymentMethod: form.paymentMethod,
      issuedAt: form.issuedDate,
    };
  }

  function validatePayload(payload) {
    if (!payload.buyerName) return "ক্রেতার নাম দিতে হবে।";

    if (!ANIMAL_TYPES.includes(payload.animalType)) {
      return "সঠিক পশুর ধরন নির্বাচন করুন।";
    }

    if (payload.animalPrice < 0) {
      return "পশুর দাম ০ বা তার বেশি হতে হবে।";
    }

    if (!CALCULATION_TYPES.includes(payload.hasilCalculationType)) {
      return "সঠিক হাসিলের ধরন নির্বাচন করুন।";
    }

    if (
      payload.hasilCalculationType === "percentage" &&
      (payload.hasilRatePercent < 0 || payload.hasilRatePercent > 100)
    ) {
      return "হাসিল শতাংশ ০ থেকে ১০০ এর মধ্যে হতে হবে।";
    }

    if (
      payload.hasilCalculationType === "fixed" &&
      payload.hasilFixedAmount < 0
    ) {
      return "নির্দিষ্ট হাসিলের টাকা ০ বা তার বেশি হতে হবে।";
    }

    if (!BILL_STATUSES.includes(payload.status)) {
      return "সঠিক বিলের অবস্থা নির্বাচন করুন।";
    }

    if (!PAYMENT_METHODS.includes(payload.paymentMethod)) {
      return "সঠিক পেমেন্ট পদ্ধতি নির্বাচন করুন।";
    }

    if (!payload.issuedAt) return "বিলের তারিখ দিতে হবে।";

    return null;
  }

  async function submitBill() {
    const payload = buildPayload();
    const validationError = validatePayload(payload);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmitting(true);

    try {
      await requestJSON(BILLS_API, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("বিল সফলভাবে তৈরি হয়েছে।");
      resetForm();
      await onCreated();
    } catch (error) {
      toast.error(error?.message || "বিল তৈরি করা যায়নি।");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-[22px] border border-[#00BC7D]/20 bg-[#00BC7D]/[0.07] p-4 sm:rounded-[28px] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-950">
              Create Client Bill
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              This bill will be created under your client account.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <SoftBadge
              icon={<FiHome className="h-3.5 w-3.5" />}
              className="border-blue-200 bg-blue-50 text-blue-700"
            >
              {currentUser?.name || "Client"}
            </SoftBadge>

            <SoftBadge
              icon={<FiGrid className="h-3.5 w-3.5" />}
              className="border-violet-200 bg-violet-50 text-violet-700"
            >
              {currentUser?.totalCounters || 0} Counters
            </SoftBadge>
          </div>
        </div>
      </section>

      <section className={cn(card, "overflow-hidden")}>
        <div className="border-b border-neutral-100 px-4 py-4 sm:px-6 sm:py-5">
          <h2 className="text-base font-bold tracking-tight text-neutral-950 sm:text-lg">
            নতুন হাসিল বিল
          </h2>
        </div>

        <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
          <section className="rounded-[22px] border border-neutral-200 bg-neutral-50/70 p-4 sm:rounded-[26px] sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field title="ক্রেতার নাম *">
                <input
                  value={form.buyerName}
                  onChange={(event) =>
                    updateField("buyerName", event.target.value)
                  }
                  className={input}
                  placeholder="ক্রেতার নাম লিখুন"
                />
              </Field>

              <Field title="ক্রেতার মোবাইল">
                <input
                  value={form.buyerPhone}
                  onChange={(event) =>
                    updateField("buyerPhone", event.target.value)
                  }
                  className={input}
                  placeholder="ঐচ্ছিক"
                />
              </Field>

              <Field title="পশুর ধরন *">
                <select
                  value={form.animalType}
                  onChange={(event) =>
                    updateField("animalType", event.target.value)
                  }
                  className={input}
                >
                  {ANIMAL_TYPES.map((animal) => (
                    <option key={animal} value={animal}>
                      {getAnimalLabel(animal)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field title="পশুর দাম *">
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={form.animalPrice}
                  onChange={(event) =>
                    updateField("animalPrice", event.target.value)
                  }
                  className={input}
                  placeholder="0"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-[22px] border border-[#00BC7D]/20 bg-[#00BC7D]/[0.06] p-4 sm:rounded-[26px] sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field title="হাসিলের ধরন *">
                <select
                  value={form.hasilCalculationType}
                  onChange={(event) =>
                    updateField("hasilCalculationType", event.target.value)
                  }
                  className={input}
                >
                  <option value="fixed">নির্দিষ্ট টাকা</option>
                  <option value="percentage">শতাংশ</option>
                </select>
              </Field>

              {form.hasilCalculationType === "percentage" ? (
                <Field title="হাসিল শতাংশ *">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    inputMode="decimal"
                    value={form.hasilRatePercent}
                    onChange={(event) =>
                      updateField("hasilRatePercent", event.target.value)
                    }
                    className={input}
                    placeholder="যেমন: ২"
                  />
                </Field>
              ) : (
                <Field title="নির্দিষ্ট হাসিলের টাকা *">
                  <input
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={form.hasilFixedAmount}
                    onChange={(event) =>
                      updateField("hasilFixedAmount", event.target.value)
                    }
                    className={input}
                    placeholder="0"
                  />
                </Field>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 items-stretch gap-3 sm:mt-5 sm:grid-cols-3">
              <AmountPreviewCard
                title="দাম"
                value={formatMoney(preview.animalPrice)}
              />

              <AmountPreviewCard
                title="হাসিল"
                value={formatMoney(preview.hasilAmount)}
                highlight
              />

              <AmountPreviewCard
                title="মোট"
                value={formatMoney(preview.totalAmount)}
              />
            </div>
          </section>

          <section className="rounded-[22px] border border-neutral-200 bg-white p-4 sm:rounded-[26px] sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field title="বিলের তারিখ *">
                <div className="relative">
                  <FiCalendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                  <input
                    type="date"
                    value={form.issuedDate}
                    onChange={(event) =>
                      updateField("issuedDate", event.target.value)
                    }
                    className={cn(input, "pl-11")}
                  />
                </div>
              </Field>

              <Field title="বিলের অবস্থা *">
                <select
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value)}
                  className={input}
                >
                  <option value="paid">পরিশোধিত</option>
                  <option value="unpaid">অপরিশোধিত</option>
                  <option value="cancelled">বাতিল</option>
                </select>
              </Field>

              <Field title="পেমেন্ট পদ্ধতি *">
                <select
                  value={form.paymentMethod}
                  onChange={(event) =>
                    updateField("paymentMethod", event.target.value)
                  }
                  className={input}
                >
                  <option value="nagad">নগদ টাকা</option>
                  <option value="cash">ক্যাশ</option>
                  <option value="bkash">বিকাশ</option>
                  <option value="rocket">রকেট</option>
                  <option value="bank">ব্যাংক</option>
                  <option value="card">কার্ড</option>
                  <option value="other">অন্যান্য</option>
                </select>
              </Field>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
            <button
              onClick={resetForm}
              disabled={submitting}
              className={cn(buttonBase, buttonSoft, "w-full sm:w-auto")}
            >
              Reset
            </button>

            <button
              onClick={submitBill}
              disabled={submitting}
              className={cn(buttonBase, buttonPrimary, "w-full sm:w-auto")}
            >
              {submitting ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <FiPlus className="h-4 w-4" />
                  Create Bill
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function AmountPreviewCard({ title, value, highlight = false }) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border px-3 py-4 text-center sm:rounded-[22px] sm:p-4",
        highlight
          ? "border-[#00BC7D]/20 bg-white text-[#008E60]"
          : "border-white/80 bg-white text-neutral-950"
      )}
    >
      <p className="text-xs font-bold text-neutral-500">{title}</p>
      <p className="mt-1 truncate text-base font-black sm:mt-2 sm:text-xl">
        {value}
      </p>
    </div>
  );
}

/* ==========================================================================
   OVERVIEW
   ========================================================================== */

function OverviewTab({
  summary,
  bills,
  teamSummary,
  currentUser,
  onGoBills,
  onGoTeam,
  onGoReports,
}) {
  const recentBills = bills.slice(0, 5);

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          title="Total Bills"
          value={summary.totalBills}
          subtitle="Current view"
          accent="bg-[#00BC7D] text-white shadow-[0_14px_30px_rgba(0,188,125,0.22)]"
          icon={<FiFileText className="h-5 w-5 sm:h-6 sm:w-6" />}
        />

        <StatCard
          title="Total Hasil"
          value={formatMoney(summary.totalHasil)}
          subtitle="Collection"
          accent="bg-[#00BC7D]/10 text-[#008E60]"
          icon={<FiDollarSign className="h-5 w-5 sm:h-6 sm:w-6" />}
        />

        <StatCard
          title="Team"
          value={teamSummary.totalMembers || 0}
          subtitle={`${teamSummary.activeMembers || 0} active`}
          accent="bg-blue-100 text-blue-700"
          icon={<FiUsers className="h-5 w-5 sm:h-6 sm:w-6" />}
        />

        <StatCard
          title="Counters"
          value={currentUser?.totalCounters || 0}
          subtitle="Configured"
          accent="bg-violet-100 text-violet-700"
          icon={<FiGrid className="h-5 w-5 sm:h-6 sm:w-6" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className={cn(card, "p-4 sm:p-6 xl:col-span-2")}>
          <div className="mb-5">
            <h2 className="text-base font-bold text-neutral-950 sm:text-lg">
              Quick Access
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Everything the client needs in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <QuickActionCard
              title="View Bills"
              description="Search and inspect all bills."
              icon={<FiFileText />}
              onClick={onGoBills}
            />

            <QuickActionCard
              title="Team Members"
              description="See counters and assigned team."
              icon={<FiUsers />}
              onClick={onGoTeam}
            />

            <QuickActionCard
              title="Reports"
              description="Counter and payment summary."
              icon={<FiBarChart2 />}
              onClick={onGoReports}
            />
          </div>
        </div>

        <div className={cn(card, "p-4 sm:p-6")}>
          <h2 className="text-base font-bold text-neutral-950 sm:text-lg">
            Payment Snapshot
          </h2>

          <div className="mt-5 space-y-3">
            <SnapshotRow
              title="Paid"
              value={summary.paidBills}
              amount={summary.paidAmount}
              color="bg-[#00BC7D]"
            />
            <SnapshotRow
              title="Unpaid"
              value={summary.unpaidBills}
              amount={summary.unpaidAmount}
              color="bg-amber-500"
            />
            <SnapshotRow
              title="Cancelled"
              value={summary.cancelledBills}
              amount={summary.cancelledAmount}
              color="bg-rose-500"
            />
          </div>
        </div>
      </section>

      <section className={cn(card, "overflow-hidden")}>
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-base font-bold text-neutral-950 sm:text-lg">
              Recent Bills
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Latest bills from this client account.
            </p>
          </div>

          <button onClick={onGoBills} className={cn(buttonBase, buttonSoft)}>
            View All
          </button>
        </div>

        <div className="divide-y divide-neutral-100">
          {recentBills.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-neutral-500">
                No recent bills found.
              </p>
            </div>
          ) : (
            recentBills.map((bill) => (
              <div
                key={getBillId(bill)}
                className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-neutral-950">
                    {bill.billNo}
                  </p>
                  <p className="mt-1 truncate text-sm text-neutral-500">
                    {bill.buyerName} • {formatDate(bill.issuedAt)}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-black text-[#008E60]">
                    {formatMoney(bill.hasilAmount)}
                  </p>
                  <StatusBadge status={bill.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function QuickActionCard({ title, description, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group rounded-[22px] border border-neutral-200 bg-neutral-50 p-4 text-left transition hover:border-[#00BC7D]/40 hover:bg-[#00BC7D]/[0.06]"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#008E60] shadow-sm transition group-hover:bg-[#00BC7D] group-hover:text-white">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-neutral-950">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-neutral-500">{description}</p>
    </button>
  );
}

function SnapshotRow({ title, value, amount, color }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
          <span className="text-sm font-bold text-neutral-700">{title}</span>
        </div>

        <span className="text-sm font-black text-neutral-950">{value}</span>
      </div>

      <p className="text-sm font-bold text-neutral-500">
        {formatMoney(amount)}
      </p>
    </div>
  );
}

/* ==========================================================================
   BILLS TAB
   ========================================================================== */

function BillsTab({
  bills,
  loadingBills,
  refreshingBills,
  onRefresh,
  onOpenDetails,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  animalFilter,
  setAnimalFilter,
  paymentFilter,
  setPaymentFilter,
  counterFilter,
  setCounterFilter,
  resetFilters,
  pagination,
  goPreviousPage,
  goNextPage,
  currentUser,
}) {
  const visibleHasilAmount = bills.reduce(
    (sum, bill) => sum + Number(bill.hasilAmount || 0),
    0
  );

  const visiblePaidBills = bills.filter(
    (bill) => String(bill.status).toLowerCase() === "paid"
  ).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          title="Bills"
          value={pagination.total}
          subtitle="Matched"
          accent="bg-[#00BC7D] text-white shadow-[0_14px_30px_rgba(0,188,125,0.22)]"
          icon={<FiFileText className="h-5 w-5 sm:h-6 sm:w-6" />}
        />

        <StatCard
          title="Hasil"
          value={formatMoney(visibleHasilAmount)}
          subtitle="Visible"
          accent="bg-[#00BC7D]/10 text-[#008E60]"
          icon={<FiDollarSign className="h-5 w-5 sm:h-6 sm:w-6" />}
        />

        <StatCard
          title="Paid"
          value={visiblePaidBills}
          subtitle="Visible"
          accent="bg-blue-100 text-blue-700"
          icon={<FiCheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
        />

        <StatCard
          title="Counters"
          value={currentUser?.totalCounters || 0}
          subtitle="Client total"
          accent="bg-violet-100 text-violet-700"
          icon={<FiGrid className="h-5 w-5 sm:h-6 sm:w-6" />}
        />
      </section>

      <section className={cn(card, "p-4 sm:p-6")}>
        <div className="space-y-3">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search bill, buyer, phone..."
              className={cn(input, "pl-11 pr-11")}
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-[#008E60]"
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={input}
            >
              <option value="">All Status</option>
              {BILL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {capitalize(status)}
                </option>
              ))}
            </select>

            <select
              value={animalFilter}
              onChange={(event) => setAnimalFilter(event.target.value)}
              className={input}
            >
              <option value="">সব পশু</option>
              {ANIMAL_TYPES.map((animal) => (
                <option key={animal} value={animal}>
                  {getAnimalLabel(animal)}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
              className={input}
            >
              <option value="">All Payments</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {getPaymentLabel(method)}
                </option>
              ))}
            </select>

            <select
              value={counterFilter}
              onChange={(event) => setCounterFilter(event.target.value)}
              className={input}
            >
              <option value="">All Counters</option>
              {Array.from({
                length: Number(currentUser?.totalCounters || 0),
              }).map((_, index) => (
                <option key={index + 1} value={index + 1}>
                  Counter {index + 1}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={resetFilters}
                className={cn(buttonBase, buttonSoft, "w-full px-2")}
              >
                Reset
              </button>

              <button
                onClick={onRefresh}
                disabled={refreshingBills}
                className={cn(buttonBase, buttonSoft, "w-full px-2")}
              >
                <FiRefreshCcw
                  className={cn("h-4 w-4", refreshingBills && "animate-spin")}
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3 lg:hidden">
        {loadingBills ? (
          <LoadingCard text="Loading bills..." />
        ) : bills.length === 0 ? (
          <EmptyCard
            icon={<FiFileText className="h-6 w-6" />}
            title="No bills found"
            description="Try changing the filters or search keyword."
          />
        ) : (
          bills.map((bill) => (
            <motion.div
              key={getBillId(bill)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(card, "p-4")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-neutral-950">
                    {bill.billNo}
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold text-neutral-700">
                    {bill.buyerName}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    {bill.buyerPhone || "No phone"}
                  </p>
                </div>

                <button
                  onClick={() => onOpenDetails(bill)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#00BC7D]/20 bg-[#00BC7D]/10 text-[#008E60] transition hover:bg-[#00BC7D]/20"
                  title="View bill"
                >
                  <FiEye className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <SoftBadge
                  icon={<FiShoppingBag className="h-3.5 w-3.5" />}
                  className="border-amber-200 bg-amber-50 text-amber-700"
                >
                  {getAnimalLabel(bill.animalType)}
                </SoftBadge>

                <StatusBadge status={bill.status} />

                <SoftBadge
                  icon={<FiCreditCard className="h-3.5 w-3.5" />}
                  className="border-sky-200 bg-sky-50 text-sky-700"
                >
                  {getPaymentLabel(bill.paymentMethod)}
                </SoftBadge>

                {bill.counterNumber && (
                  <SoftBadge
                    icon={<FiGrid className="h-3.5 w-3.5" />}
                    className="border-violet-200 bg-violet-50 text-violet-700"
                  >
                    Counter {bill.counterNumber}
                  </SoftBadge>
                )}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-neutral-50 p-2.5">
                <MiniAmount
                  title="Hasil"
                  value={formatMoney(bill.hasilAmount)}
                  highlight
                />

                <MiniAmount
                  title="Total"
                  value={formatMoney(bill.hasilAmount)}
                />

                <MiniAmount
                  title="Date"
                  value={formatDate(bill.issuedAt)}
                  compact
                />
              </div>
            </motion.div>
          ))
        )}
      </section>

      <section className={cn(card, "hidden overflow-hidden lg:block")}>
        <div className="border-b border-neutral-100 px-6 py-5">
          <h2 className="text-lg font-bold tracking-tight text-neutral-950">
            Client Bills
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/80 text-left text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-500">
                <th className="px-6 py-4">Bill</th>
                <th className="px-5 py-4">Buyer</th>
                <th className="px-5 py-4">Animal</th>
                <th className="px-5 py-4">Amounts</th>
                <th className="px-5 py-4">Created By</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-6 py-4 text-right">View</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100">
              {loadingBills ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="inline-flex items-center gap-3 text-sm font-semibold text-neutral-500">
                      <FiLoader className="h-5 w-5 animate-spin text-[#00BC7D]" />
                      Loading bills...
                    </div>
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <h3 className="text-base font-bold text-neutral-950">
                      No bills found
                    </h3>
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <motion.tr
                    key={getBillId(bill)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="transition hover:bg-[#00BC7D]/[0.035]"
                  >
                    <td className="px-6 py-5 align-top">
                      <div className="min-w-[170px]">
                        <p className="text-sm font-bold text-neutral-950">
                          {bill.billNo}
                        </p>

                        {bill.counterNumber && (
                          <p className="mt-1 text-xs font-semibold text-neutral-400">
                            Counter {bill.counterNumber}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <div className="min-w-[180px]">
                        <p className="text-sm font-bold text-neutral-950">
                          {bill.buyerName}
                        </p>

                        <p className="mt-1 text-sm text-neutral-500">
                          {bill.buyerPhone || "No phone"}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <SoftBadge
                        icon={<FiShoppingBag className="h-3.5 w-3.5" />}
                        className="border-amber-200 bg-amber-50 text-amber-700"
                      >
                        {getAnimalLabel(bill.animalType)}
                      </SoftBadge>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <div className="min-w-[180px] space-y-1 text-sm">
                        <p className="font-semibold text-neutral-500">
                          Hasil:{" "}
                          <span className="font-bold text-[#008E60]">
                            {formatMoney(bill.hasilAmount)}
                          </span>
                        </p>

                        <p className="font-semibold text-neutral-500">
                          Total:{" "}
                          <span className="font-bold text-neutral-950">
                            {formatMoney(bill.hasilAmount)}
                          </span>
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <div className="min-w-[150px]">
                        <p className="text-sm font-bold text-neutral-950">
                          {bill.createdBy?.name || "Client"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-neutral-400">
                          {bill.createdBy?.role
                            ? capitalize(bill.createdBy.role)
                            : "—"}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <div className="min-w-[150px] space-y-2">
                        <StatusBadge status={bill.status} />

                        <p className="text-sm font-semibold text-neutral-500">
                          {getPaymentLabel(bill.paymentMethod)}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <div className="min-w-[130px] text-sm text-neutral-600">
                        {formatDate(bill.issuedAt)}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-right align-top">
                      <button
                        onClick={() => onOpenDetails(bill)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#00BC7D]/20 bg-[#00BC7D]/10 text-[#008E60] transition hover:bg-[#00BC7D]/20"
                        title="View bill"
                      >
                        <FiEye className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className={cn(
          card,
          "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
        )}
      >
        <p className="text-xs font-medium text-neutral-500 sm:text-sm">
          Page{" "}
          <span className="font-bold text-neutral-950">{pagination.page}</span>{" "}
          of{" "}
          <span className="font-bold text-neutral-950">
            {pagination.totalPages || 1}
          </span>
          . Total:{" "}
          <span className="font-bold text-neutral-950">{pagination.total}</span>
        </p>

        <div className="grid grid-cols-2 gap-3 sm:flex">
          <button
            onClick={goPreviousPage}
            disabled={!pagination.hasPrevPage}
            className={cn(buttonBase, buttonSoft, "w-full sm:w-auto")}
          >
            <FiChevronLeft className="h-4 w-4" />
            Prev
          </button>

          <button
            onClick={goNextPage}
            disabled={!pagination.hasNextPage}
            className={cn(buttonBase, buttonSoft, "w-full sm:w-auto")}
          >
            Next
            <FiChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

function MiniAmount({ title, value, highlight = false, compact = false }) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-400">
        {title}
      </p>

      <p
        className={cn(
          "mt-1 truncate font-bold",
          compact ? "text-[10px]" : "text-[11px]",
          highlight ? "text-[#008E60]" : "text-neutral-950"
        )}
      >
        {value}
      </p>
    </div>
  );
}

/* ==========================================================================
   TEAM TAB
   ========================================================================== */

function TeamTab({
  teamData,
  loadingTeam,
  refreshingTeam,
  onRefresh,
  teamSearch,
  setTeamSearch,
  teamStatusFilter,
  setTeamStatusFilter,
  teamCounterFilter,
  setTeamCounterFilter,
  currentUser,
}) {
  const members = teamData?.members || [];
  const counters = teamData?.counters || [];
  const summary = teamData?.summary || {};

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const searchText = teamSearch.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        member.name?.toLowerCase().includes(searchText) ||
        member.username?.toLowerCase().includes(searchText) ||
        member.email?.toLowerCase().includes(searchText) ||
        member.phone?.toLowerCase().includes(searchText);

      const matchesStatus =
        !teamStatusFilter || member.status === teamStatusFilter;

      const matchesCounter =
        !teamCounterFilter ||
        Number(member.counterNumber) === Number(teamCounterFilter);

      return matchesSearch && matchesStatus && matchesCounter;
    });
  }, [members, teamSearch, teamStatusFilter, teamCounterFilter]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          title="Members"
          value={summary.totalMembers || 0}
          subtitle="Total team"
          accent="bg-[#00BC7D] text-white shadow-[0_14px_30px_rgba(0,188,125,0.22)]"
          icon={<FiUsers className="h-5 w-5 sm:h-6 sm:w-6" />}
        />

        <StatCard
          title="Active"
          value={summary.activeMembers || 0}
          subtitle="Working"
          accent="bg-[#00BC7D]/10 text-[#008E60]"
          icon={<FiCheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
        />

        <StatCard
          title="Inactive"
          value={summary.inactiveMembers || 0}
          subtitle="Not active"
          accent="bg-amber-100 text-amber-700"
          icon={<FiSlash className="h-5 w-5 sm:h-6 sm:w-6" />}
        />

        <StatCard
          title="Counters"
          value={currentUser?.totalCounters || 0}
          subtitle="Client setup"
          accent="bg-blue-100 text-blue-700"
          icon={<FiGrid className="h-5 w-5 sm:h-6 sm:w-6" />}
        />
      </section>

      <section className={cn(card, "p-4 sm:p-6")}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_180px_120px]">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

            <input
              value={teamSearch}
              onChange={(event) => setTeamSearch(event.target.value)}
              placeholder="Search team member..."
              className={cn(input, "pl-11")}
            />
          </div>

          <select
            value={teamStatusFilter}
            onChange={(event) => setTeamStatusFilter(event.target.value)}
            className={input}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={teamCounterFilter}
            onChange={(event) => setTeamCounterFilter(event.target.value)}
            className={input}
          >
            <option value="">All Counters</option>
            {Array.from({
              length: Number(currentUser?.totalCounters || 0),
            }).map((_, index) => (
              <option key={index + 1} value={index + 1}>
                Counter {index + 1}
              </option>
            ))}
          </select>

          <button
            onClick={onRefresh}
            disabled={refreshingTeam}
            className={cn(buttonBase, buttonSoft)}
          >
            <FiRefreshCcw
              className={cn("h-4 w-4", refreshingTeam && "animate-spin")}
            />
            Refresh
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className={cn(card, "p-4 sm:p-6 xl:col-span-2")}>
          <div className="mb-5">
            <h2 className="text-base font-bold text-neutral-950 sm:text-lg">
              Team Members
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {filteredMembers.length} members matched
            </p>
          </div>

          {loadingTeam ? (
            <LoadingCard text="Loading team..." />
          ) : filteredMembers.length === 0 ? (
            <EmptyCard
              icon={<FiUsers className="h-6 w-6" />}
              title="No team members found"
              description="Try changing your filters."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {filteredMembers.map((member) => (
                <TeamMemberCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </div>

        <div className={cn(card, "p-4 sm:p-6")}>
          <h2 className="text-base font-bold text-neutral-950 sm:text-lg">
            Counter Groups
          </h2>

          <div className="mt-5 space-y-3">
            {counters.length === 0 ? (
              <p className="text-sm font-semibold text-neutral-500">
                No counter groups found.
              </p>
            ) : (
              counters.map((counter) => (
                <div
                  key={counter.counterNumber || "no-counter"}
                  className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-neutral-950">
                        {counter.counterNumber
                          ? `Counter ${counter.counterNumber}`
                          : "No Counter"}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-neutral-500">
                        {counter.totalMembers || 0} members
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00BC7D]/10 text-[#008E60]">
                      <FiGrid />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <SmallCounterStat
                      title="Active"
                      value={counter.activeMembers || 0}
                    />
                    <SmallCounterStat
                      title="Inactive"
                      value={counter.inactiveMembers || 0}
                    />
                    <SmallCounterStat
                      title="Suspended"
                      value={counter.suspendedMembers || 0}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function TeamMemberCard({ member }) {
  return (
    <div className="rounded-[22px] border border-neutral-200 bg-neutral-50/70 p-4 transition hover:border-[#00BC7D]/30 hover:bg-white">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00BC7D] text-sm font-black text-white">
          {getInitials(member.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-neutral-950">
                {member.name || "Team Member"}
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-neutral-500">
                @{member.username || "unknown"}
              </p>
            </div>

            <StatusBadge status={member.status} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <SoftBadge
              icon={<FiGrid className="h-3.5 w-3.5" />}
              className="border-violet-200 bg-violet-50 text-violet-700"
            >
              Counter {member.counterNumber || "—"}
            </SoftBadge>

            <SoftBadge
              icon={<FiBriefcase className="h-3.5 w-3.5" />}
              className="border-blue-200 bg-blue-50 text-blue-700"
            >
              {capitalize(member.role)}
            </SoftBadge>
          </div>

          <div className="mt-3 space-y-1.5 text-xs font-semibold text-neutral-500">
            <p className="truncate">
              <FiPhone className="mr-1.5 inline h-3.5 w-3.5 text-[#008E60]" />
              {member.phone || "No phone"}
            </p>
            <p className="truncate">
              <FiMail className="mr-1.5 inline h-3.5 w-3.5 text-[#008E60]" />
              {member.email || "No email"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SmallCounterStat({ title, value }) {
  return (
    <div className="rounded-xl bg-white px-2 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
        {title}
      </p>
      <p className="mt-1 text-sm font-black text-neutral-950">{value}</p>
    </div>
  );
}

/* ==========================================================================
   REPORTS
   ========================================================================== */

function ReportsTab({ bills, currentUser, teamData }) {
  const report = useMemo(() => {
    const byCounter = new Map();
    const byPayment = new Map();
    const byAnimal = new Map();
    const byCreator = new Map();

    for (const bill of bills) {
      const counterKey = bill.counterNumber
        ? `Counter ${bill.counterNumber}`
        : "Client / No Counter";
      const paymentKey = getPaymentLabel(bill.paymentMethod);
      const animalKey = getAnimalLabel(bill.animalType);
      const creatorKey = bill.createdBy?.name || "Client";
      const amount = Number(bill.hasilAmount || 0);

      byCounter.set(counterKey, {
        title: counterKey,
        count: (byCounter.get(counterKey)?.count || 0) + 1,
        amount: (byCounter.get(counterKey)?.amount || 0) + amount,
      });

      byPayment.set(paymentKey, {
        title: paymentKey,
        count: (byPayment.get(paymentKey)?.count || 0) + 1,
        amount: (byPayment.get(paymentKey)?.amount || 0) + amount,
      });

      byAnimal.set(animalKey, {
        title: animalKey,
        count: (byAnimal.get(animalKey)?.count || 0) + 1,
        amount: (byAnimal.get(animalKey)?.amount || 0) + amount,
      });

      byCreator.set(creatorKey, {
        title: creatorKey,
        count: (byCreator.get(creatorKey)?.count || 0) + 1,
        amount: (byCreator.get(creatorKey)?.amount || 0) + amount,
      });
    }

    return {
      byCounter: Array.from(byCounter.values()).sort(
        (a, b) => b.amount - a.amount
      ),
      byPayment: Array.from(byPayment.values()).sort(
        (a, b) => b.amount - a.amount
      ),
      byAnimal: Array.from(byAnimal.values()).sort(
        (a, b) => b.amount - a.amount
      ),
      byCreator: Array.from(byCreator.values()).sort(
        (a, b) => b.amount - a.amount
      ),
    };
  }, [bills]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          title="Report Bills"
          value={bills.length}
          subtitle="Loaded bills"
          accent="bg-[#00BC7D] text-white shadow-[0_14px_30px_rgba(0,188,125,0.22)]"
          icon={<FiPieChart className="h-5 w-5 sm:h-6 sm:w-6" />}
        />

        <StatCard
          title="Team"
          value={teamData?.summary?.totalMembers || 0}
          subtitle="Members"
          accent="bg-blue-100 text-blue-700"
          icon={<FiUsers className="h-5 w-5 sm:h-6 sm:w-6" />}
        />

        <StatCard
          title="Counters"
          value={currentUser?.totalCounters || 0}
          subtitle="Client setup"
          accent="bg-violet-100 text-violet-700"
          icon={<FiGrid className="h-5 w-5 sm:h-6 sm:w-6" />}
        />

        <StatCard
          title="Total Hasil"
          value={formatMoney(
            bills.reduce((sum, bill) => sum + Number(bill.hasilAmount || 0), 0)
          )}
          subtitle="Loaded"
          accent="bg-[#00BC7D]/10 text-[#008E60]"
          icon={<FiTrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ReportCard title="Counter Wise Report" icon={<FiGrid />}>
          <ReportRows rows={report.byCounter} empty="No counter report found." />
        </ReportCard>

        <ReportCard title="Team / Creator Wise Report" icon={<FiUsers />}>
          <ReportRows rows={report.byCreator} empty="No creator report found." />
        </ReportCard>

        <ReportCard title="Payment Method Report" icon={<FiCreditCard />}>
          <ReportRows rows={report.byPayment} empty="No payment report found." />
        </ReportCard>

        <ReportCard title="Animal Type Report" icon={<FiShoppingBag />}>
          <ReportRows rows={report.byAnimal} empty="No animal report found." />
        </ReportCard>
      </section>
    </div>
  );
}

function ReportCard({ title, icon, children }) {
  return (
    <div className={cn(card, "p-4 sm:p-6")}>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00BC7D]/10 text-[#008E60]">
          {icon}
        </div>
        <h2 className="text-base font-bold text-neutral-950 sm:text-lg">
          {title}
        </h2>
      </div>

      {children}
    </div>
  );
}

function ReportRows({ rows, empty }) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-5 text-center">
        <p className="text-sm font-semibold text-neutral-500">{empty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div
          key={row.title}
          className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-neutral-950">
                {row.title}
              </p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                {row.count} bills
              </p>
            </div>

            <p className="shrink-0 text-sm font-black text-[#008E60]">
              {formatMoney(row.amount)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   PROFILE
   ========================================================================== */

function ProfileTab({ currentUser, teamData }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <section className={cn(card, "overflow-hidden")}>
        <div className="p-5 sm:p-8">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-[#00BC7D] text-xl font-bold text-white shadow-[0_16px_34px_rgba(0,188,125,0.26)] sm:h-20 sm:w-20 sm:rounded-[28px] sm:text-2xl">
              {getInitials(currentUser?.name)}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                {currentUser?.name || "Client"}
              </h1>

              <p className="mt-1 truncate text-sm font-medium text-neutral-500">
                @{currentUser?.username || "unknown"}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge status={currentUser?.status || "active"} />

                <SoftBadge
                  icon={<FiBriefcase className="h-3.5 w-3.5" />}
                  className="border-blue-200 bg-blue-50 text-blue-700"
                >
                  {capitalize(currentUser?.role)}
                </SoftBadge>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className={cn(card, "p-4 sm:p-6")}>
          <div className="mb-4 flex items-center gap-3 sm:mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00BC7D] text-white sm:h-11 sm:w-11">
              <FiInfo />
            </div>

            <h2 className="text-base font-bold text-neutral-950">
              Account Details
            </h2>
          </div>

          <div className="space-y-3 text-sm">
            <ProfileRow
              icon={<FiUser />}
              title="Name"
              value={currentUser?.name || "—"}
            />
            <ProfileRow
              icon={<FiHash />}
              title="Username"
              value={`@${currentUser?.username || "—"}`}
            />
            <ProfileRow
              icon={<FiMail />}
              title="Email"
              value={currentUser?.email || "—"}
            />
            <ProfileRow
              icon={<FiPhone />}
              title="Phone"
              value={currentUser?.phone || "—"}
            />
            <ProfileRow
              icon={<FiCheckCircle />}
              title="Status"
              value={capitalize(currentUser?.status)}
            />
            <ProfileRow
              icon={<FiBriefcase />}
              title="Role"
              value={capitalize(currentUser?.role)}
            />
          </div>
        </div>

        <div className={cn(card, "p-4 sm:p-6")}>
          <div className="mb-4 flex items-center gap-3 sm:mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-white sm:h-11 sm:w-11">
              <FiHome />
            </div>

            <h2 className="text-base font-bold text-neutral-950">
              Hasil Setup
            </h2>
          </div>

          <div className="space-y-3 text-sm">
            <ProfileRow
              icon={<FiHome />}
              title="Address"
              value={currentUser?.address || "—"}
            />

            <ProfileRow
              icon={<FiGrid />}
              title="Hasil Location"
              value={currentUser?.hasilLocation || "—"}
            />

            <ProfileRow
              icon={<FiGrid />}
              title="Total Counters"
              value={currentUser?.totalCounters ?? 0}
            />

            <ProfileRow
              icon={<FiUsers />}
              title="Team Members"
              value={teamData?.summary?.totalMembers || 0}
            />

            <ProfileRow
              icon={<FiCheckCircle />}
              title="Active Members"
              value={teamData?.summary?.activeMembers || 0}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfileRow({ icon, title, value }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/80 px-3 py-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5 text-neutral-500 sm:gap-3">
        <span className="shrink-0 text-[#008E60]">{icon}</span>
        <span className="truncate text-xs font-semibold sm:text-sm">
          {title}
        </span>
      </div>

      <span className="max-w-[54%] break-words text-right text-xs font-bold text-neutral-950 sm:text-sm">
        {value}
      </span>
    </div>
  );
}

/* ==========================================================================
   BILL DETAILS MODAL
   ========================================================================== */

function BillDetailsModal({ open, onClose, bill }) {
  if (!bill) return null;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={`Bill ${bill.billNo || ""}`}
      subtitle="Bill Details"
      icon={<FiFileText />}
      maxWidthClass="max-w-4xl"
      footer={
        <div className="flex justify-end">
          <button onClick={onClose} className={cn(buttonBase, buttonSoft)}>
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4 sm:space-y-5">
        <section className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-3 sm:gap-4">
          <SummaryCard title="দাম" value={formatMoney(bill.animalPrice)} />

          <SummaryCard
            title="হাসিল"
            value={formatMoney(bill.hasilAmount)}
            highlight
          />

          <SummaryCard title="মোট" value={formatMoney(bill.hasilAmount)} />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-[22px] border border-neutral-200 bg-white p-4 sm:rounded-[26px] sm:p-5">
            <h3 className="text-sm font-bold text-neutral-950 sm:text-base">
              বিলের তথ্য
            </h3>

            <div className="mt-4 space-y-3 text-sm">
              <DetailRow title="বিল নম্বর" value={bill.billNo} />
              <DetailRow title="তারিখ" value={formatDate(bill.issuedAt)} />
              <DetailRow
                title="কাউন্টার"
                value={
                  bill.counterNumber ? `Counter ${bill.counterNumber}` : "—"
                }
              />
              <DetailRow
                title="অবস্থা"
                value={<StatusBadge status={bill.status} />}
              />
              <DetailRow
                title="পেমেন্ট"
                value={getPaymentLabel(bill.paymentMethod)}
              />
              <DetailRow
                title="Created By"
                value={bill.createdBy?.name || "Client"}
              />
            </div>
          </div>

          <div className="rounded-[22px] border border-neutral-200 bg-white p-4 sm:rounded-[26px] sm:p-5">
            <h3 className="text-sm font-bold text-neutral-950 sm:text-base">
              ক্রেতা ও হাসিল
            </h3>

            <div className="mt-4 space-y-3 text-sm">
              <DetailRow title="ক্রেতার নাম" value={bill.buyerName} />
              <DetailRow
                title="ক্রেতার মোবাইল"
                value={bill.buyerPhone || "—"}
              />
              <DetailRow
                title="পশুর ধরন"
                value={getAnimalLabel(bill.animalType)}
              />
              <DetailRow
                title="হাসিলের ধরন"
                value={capitalize(bill.hasilCalculationType)}
              />
              <DetailRow
                title="রেট"
                value={
                  bill.hasilCalculationType === "percentage"
                    ? `${bill.hasilRatePercent || 0}%`
                    : formatMoney(bill.hasilFixedAmount || 0)
                }
              />
            </div>
          </div>
        </section>
      </div>
    </ModalShell>
  );
}

function SummaryCard({ title, value, highlight = false }) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border px-2 py-3 text-center sm:rounded-[24px] sm:p-5",
        highlight
          ? "border-[#00BC7D]/20 bg-[#00BC7D]/[0.07]"
          : "border-neutral-200 bg-neutral-50"
      )}
    >
      <p className="text-xs font-bold text-neutral-500">{title}</p>

      <p
        className={cn(
          "mt-1 truncate text-[13px] font-bold sm:mt-2 sm:text-2xl",
          highlight ? "text-[#008E60]" : "text-neutral-950"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({ title, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-neutral-100 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="text-xs font-semibold text-neutral-500 sm:text-sm">
        {title}
      </span>

      <span className="break-words text-left text-sm font-bold text-neutral-950 sm:max-w-[58%] sm:text-right">
        {value}
      </span>
    </div>
  );
}

/* ==========================================================================
   MAIN PAGE
   ========================================================================== */

export default function ClientHasilDashboardPage() {
  const router = useRouter();

  const [authLoading, setAuthLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [activeTab, setActiveTab] = useState("overview");

  const [bills, setBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [refreshingBills, setRefreshingBills] = useState(false);

  const [teamData, setTeamData] = useState({
    client: null,
    summary: {
      totalMembers: 0,
      activeMembers: 0,
      inactiveMembers: 0,
      suspendedMembers: 0,
      totalCounters: 0,
    },
    counters: [],
    members: [],
  });
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [refreshingTeam, setRefreshingTeam] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  const [selectedBill, setSelectedBill] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [animalFilter, setAnimalFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [counterFilter, setCounterFilter] = useState("");

  const [teamSearch, setTeamSearch] = useState("");
  const [teamStatusFilter, setTeamStatusFilter] = useState("");
  const [teamCounterFilter, setTeamCounterFilter] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const summary = useMemo(() => {
    const paidBills = bills.filter((bill) => bill.status === "paid");
    const unpaidBills = bills.filter((bill) => bill.status === "unpaid");
    const cancelledBills = bills.filter((bill) => bill.status === "cancelled");

    const sumAmount = (items) =>
      items.reduce((sum, bill) => sum + Number(bill.hasilAmount || 0), 0);

    return {
      totalBills: pagination.total || bills.length,
      loadedBills: bills.length,
      totalHasil: sumAmount(bills),
      paidBills: paidBills.length,
      unpaidBills: unpaidBills.length,
      cancelledBills: cancelledBills.length,
      paidAmount: sumAmount(paidBills),
      unpaidAmount: sumAmount(unpaidBills),
      cancelledAmount: sumAmount(cancelledBills),
      totalTeamMembers: teamData?.summary?.totalMembers || 0,
    };
  }, [bills, pagination.total, teamData]);

  useEffect(() => {
    verifyClientAccess();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (currentUser?.role === "client") {
      fetchBills(1);
    }
  }, [debouncedSearch, statusFilter, animalFilter, paymentFilter, counterFilter]);

  async function verifyClientAccess() {
    setAuthLoading(true);

    try {
      const data = await requestJSON(ME_API, {
        method: "GET",
      });

      const user = data.data.user;

      if (user.role !== "client") {
        setCurrentUser(user);
        setAccessDenied(true);
        toast.error("Only clients can access this page.");
        return;
      }

      setCurrentUser(user);
      setAccessDenied(false);

      await Promise.all([fetchBills(1), fetchClientTeam()]);
    } catch (error) {
      setAccessDenied(true);
      toast.error(error?.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function fetchBills(page = 1) {
    setLoadingBills(true);

    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(pagination.limit));

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);
      if (animalFilter) params.set("animalType", animalFilter);
      if (paymentFilter) params.set("paymentMethod", paymentFilter);
      if (counterFilter) params.set("counterNumber", counterFilter);

      const data = await requestJSON(`${BILLS_API}?${params.toString()}`, {
        method: "GET",
      });

      setBills(data.data.items || []);
      setPagination(data.data.pagination);
    } catch (error) {
      toast.error(error?.message || "Failed to fetch bills.");
    } finally {
      setLoadingBills(false);
    }
  }

  async function fetchClientTeam() {
    setLoadingTeam(true);

    try {
      const data = await requestJSON(CLIENT_TEAM_API, {
        method: "GET",
      });

      setTeamData(
        data.data || {
          client: null,
          summary: {},
          counters: [],
          members: [],
        }
      );
    } catch (error) {
      toast.error(error?.message || "Failed to fetch team.");
    } finally {
      setLoadingTeam(false);
    }
  }

  async function handleCreatedBill() {
    await fetchBills(1);
    setActiveTab("bills");
  }

  async function handleRefreshAll() {
    setRefreshingBills(true);
    setRefreshingTeam(true);

    try {
      await Promise.all([fetchBills(pagination.page), fetchClientTeam()]);
      toast.success("Dashboard refreshed.");
    } finally {
      setRefreshingBills(false);
      setRefreshingTeam(false);
    }
  }

  async function handleRefreshBills() {
    setRefreshingBills(true);

    try {
      await fetchBills(pagination.page);
      toast.success("Bills refreshed.");
    } finally {
      setRefreshingBills(false);
    }
  }

  async function handleRefreshTeam() {
    setRefreshingTeam(true);

    try {
      await fetchClientTeam();
      toast.success("Team refreshed.");
    } finally {
      setRefreshingTeam(false);
    }
  }

  async function handleLogout() {
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
  }

  function openBillDetails(bill) {
    setSelectedBill(bill);
    setDetailsOpen(true);
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setAnimalFilter("");
    setPaymentFilter("");
    setCounterFilter("");
  }

  function goPreviousPage() {
    if (!pagination.hasPrevPage) return;
    fetchBills(pagination.page - 1);
  }

  function goNextPage() {
    if (!pagination.hasNextPage) return;
    fetchBills(pagination.page + 1);
  }

  if (authLoading) {
    return (
      <>
        <Toaster position="top-right" />

        <CenterStateCard
          icon={<FiLoader className="h-6 w-6 animate-spin" />}
          title="Checking Access"
          description="Loading your client dashboard."
        />
      </>
    );
  }

  if (accessDenied || currentUser?.role !== "client") {
    return (
      <>
        <Toaster position="top-right" />

        <CenterStateCard
          icon={<FiSlash className="h-6 w-6" />}
          title="Client Access Required"
          description="This dashboard is only for client accounts."
        />
      </>
    );
  }

  return (
    <>
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
              primary: "#00BC7D",
              secondary: "#ffffff",
            },
          },
        }}
      />

      <main className={pageShell}>
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
          <ClientHero
            currentUser={currentUser}
            summary={summary}
            refreshing={refreshingBills || refreshingTeam}
            loggingOut={loggingOut}
            onCreate={() => setActiveTab("create")}
            onRefresh={handleRefreshAll}
            onLogout={handleLogout}
          />

          <ClientTabBar
            activeTab={activeTab}
            onChange={setActiveTab}
            counts={{
              bills: pagination.total,
              team: teamData?.summary?.totalMembers || 0,
            }}
          />

          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
              >
                <OverviewTab
                  summary={summary}
                  bills={bills}
                  teamSummary={teamData?.summary || {}}
                  currentUser={currentUser}
                  onGoBills={() => setActiveTab("bills")}
                  onGoTeam={() => setActiveTab("team")}
                  onGoReports={() => setActiveTab("reports")}
                />
              </motion.div>
            )}

            {activeTab === "create" && (
              <motion.div
                key="create-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
              >
                <AddBillTab
                  currentUser={currentUser}
                  onCreated={handleCreatedBill}
                />
              </motion.div>
            )}

            {activeTab === "bills" && (
              <motion.div
                key="bills-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
              >
                <BillsTab
                  bills={bills}
                  loadingBills={loadingBills}
                  refreshingBills={refreshingBills}
                  onRefresh={handleRefreshBills}
                  onOpenDetails={openBillDetails}
                  search={search}
                  setSearch={setSearch}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  animalFilter={animalFilter}
                  setAnimalFilter={setAnimalFilter}
                  paymentFilter={paymentFilter}
                  setPaymentFilter={setPaymentFilter}
                  counterFilter={counterFilter}
                  setCounterFilter={setCounterFilter}
                  resetFilters={resetFilters}
                  pagination={pagination}
                  goPreviousPage={goPreviousPage}
                  goNextPage={goNextPage}
                  currentUser={currentUser}
                />
              </motion.div>
            )}

            {activeTab === "team" && (
              <motion.div
                key="team-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
              >
                <TeamTab
                  teamData={teamData}
                  loadingTeam={loadingTeam}
                  refreshingTeam={refreshingTeam}
                  onRefresh={handleRefreshTeam}
                  teamSearch={teamSearch}
                  setTeamSearch={setTeamSearch}
                  teamStatusFilter={teamStatusFilter}
                  setTeamStatusFilter={setTeamStatusFilter}
                  teamCounterFilter={teamCounterFilter}
                  setTeamCounterFilter={setTeamCounterFilter}
                  currentUser={currentUser}
                />
              </motion.div>
            )}

            {activeTab === "reports" && (
              <motion.div
                key="reports-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
              >
                <ReportsTab
                  bills={bills}
                  currentUser={currentUser}
                  teamData={teamData}
                />
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div
                key="profile-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
              >
                <ProfileTab currentUser={currentUser} teamData={teamData} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {detailsOpen && (
          <BillDetailsModal
            open={detailsOpen}
            onClose={() => {
              setDetailsOpen(false);
              setSelectedBill(null);
            }}
            bill={selectedBill}
          />
        )}
      </AnimatePresence>
    </>
  );
}