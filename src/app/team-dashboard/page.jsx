"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  FiPlus,
  FiFileText,
  FiUser,
  FiSearch,
  FiRefreshCcw,
  FiLoader,
  FiLogOut,
  FiSlash,
  FiCheckCircle,
  FiX,
  FiEye,
  FiDollarSign,
  FiTag,
  FiPhone,
  FiMail,
  FiGrid,
  FiHash,
  FiHome,
  FiShoppingBag,
  FiBriefcase,
  FiInfo,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiCreditCard,
} from "react-icons/fi";

/* ==========================================================================
   API CONFIG
   ========================================================================== */

const API_ROOT = process.env.NEXT_PUBLIC_API_URL || "";

const BILLS_API = `${API_ROOT}/api/hasil-bills`;
const ME_API = `${API_ROOT}/api/auth/me`;
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

const label = "mb-2 block text-sm font-bold leading-6 text-neutral-700 sm:text-sm";

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

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

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
   MODAL SHELL
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
   TOP TAB NAVIGATION
   ========================================================================== */

function TeamTopTabs({ activeTab, onChange }) {
  const tabs = [
    {
      id: "create",
      label: "Add",
      icon: <FiPlus className="h-4 w-4" />,
    },
    {
      id: "bills",
      label: "Bills",
      icon: <FiFileText className="h-4 w-4" />,
    },
    {
      id: "profile",
      label: "Profile",
      icon: <FiUser className="h-4 w-4" />,
    },
  ];

  return (
    <section className={cn(card, "p-2")}>
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex h-[58px] flex-col items-center justify-center gap-1 rounded-[18px] text-[11px] font-bold transition sm:h-14 sm:flex-row sm:gap-2 sm:rounded-[22px] sm:text-sm",
                active
                  ? "bg-[#00BC7D] text-white shadow-[0_14px_28px_rgba(0,188,125,0.24)]"
                  : "text-neutral-600 hover:bg-[#00BC7D]/[0.06] hover:text-[#008E60]"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ==========================================================================
   ADD BILL TAB
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
      <section className="rounded-[22px] border border-[#00BC7D]/20 bg-[#00BC7D]/[0.07] p-3 sm:rounded-[28px] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-neutral-700">
            আপনার নির্ধারিত ক্লায়েন্ট ও কাউন্টার
          </p>

          <div className="flex flex-wrap gap-2">
            <SoftBadge
              icon={<FiHome className="h-3.5 w-3.5" />}
              className="border-blue-200 bg-blue-50 text-blue-700"
            >
              {typeof currentUser?.client === "object"
                ? currentUser?.client?.name || "Client"
                : "Client"}
            </SoftBadge>

            <SoftBadge
              icon={<FiGrid className="h-3.5 w-3.5" />}
              className="border-violet-200 bg-violet-50 text-violet-700"
            >
              Counter {currentUser?.counterNumber || "—"}
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
                  onChange={(event) =>
                    updateField("status", event.target.value)
                  }
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
              রিসেট
            </button>

            <button
              onClick={submitBill}
              disabled={submitting}
              className={cn(buttonBase, buttonPrimary, "w-full sm:w-auto")}
            >
              {submitting ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin" />
                  সংরক্ষণ
                </>
              ) : (
                <>
                  <FiPlus className="h-4 w-4" />
                  বিল তৈরি
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
   MY BILLS TAB
   ========================================================================== */

function MyBillsTab({
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
  resetFilters,
  pagination,
  goPreviousPage,
  goNextPage,
}) {
  const visibleTotalAmount = bills.reduce(
    (sum, bill) => sum + Number(bill.hasilAmount || 0),
    0
  );

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
          title="Hasil Amount"
          value={formatMoney(visibleHasilAmount)}
          subtitle="Visible"
          accent="bg-[#00BC7D]/10 text-[#008E60]"
          icon={<FiDollarSign className="h-5 w-5 sm:h-6 sm:w-6" />}
        />

        <StatCard
          title="Total"
          value={formatMoney(visibleTotalAmount)}
          subtitle="Visible"
          accent="bg-blue-100 text-blue-700"
          icon={<FiTag className="h-5 w-5 sm:h-6 sm:w-6" />}
        />

        <StatCard
          title="Paid"
          value={visiblePaidBills}
          subtitle="Visible"
          accent="bg-violet-100 text-violet-700"
          icon={<FiCheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
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

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                  className={cn(
                    "h-4 w-4",
                    refreshingBills && "animate-spin"
                  )}
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
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-neutral-50 p-2.5">
                <MiniAmount
                  title="Hasil Amount"
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
            My Bills
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
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-6 py-4 text-right">View</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100">
              {loadingBills ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="inline-flex items-center gap-3 text-sm font-semibold text-neutral-500">
                      <FiLoader className="h-5 w-5 animate-spin text-[#00BC7D]" />
                      Loading bills...
                    </div>
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
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
                    exit={{ opacity: 0 }}
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
                          Hasil Amount:{" "}
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
   PROFILE TAB
   ========================================================================== */

function ProfileTab({ currentUser }) {
  const client =
    typeof currentUser?.client === "object" ? currentUser.client : null;

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
                {currentUser?.name || "Team Member"}
              </h1>

              <p className="mt-1 truncate text-sm font-medium text-neutral-500">
                @{currentUser?.username || "unknown"}
              </p>
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
              Assigned Details
            </h2>
          </div>

          <div className="space-y-3 text-sm">
            <ProfileRow
              icon={<FiHome />}
              title="Client"
              value={client?.name || "Assigned Client"}
            />

            <ProfileRow
              icon={<FiHash />}
              title="Client Username"
              value={client?.username ? `@${client.username}` : "—"}
            />

            <ProfileRow
              icon={<FiMail />}
              title="Client Email"
              value={client?.email || "—"}
            />

            <ProfileRow
              icon={<FiPhone />}
              title="Client Phone"
              value={client?.phone || "—"}
            />

            <ProfileRow
              icon={<FiGrid />}
              title="Counter"
              value={
                currentUser?.counterNumber
                  ? `Counter ${currentUser.counterNumber}`
                  : "—"
              }
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
   MAIN PAGE
   ========================================================================== */

export default function TeamHasilBillingPage() {
  const router = useRouter();

  const [authLoading, setAuthLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [activeTab, setActiveTab] = useState("create");

  const [bills, setBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [refreshingBills, setRefreshingBills] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [selectedBill, setSelectedBill] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [animalFilter, setAnimalFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    verifyTeamAccess();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (currentUser?.role === "team") {
      fetchBills(1);
    }
  }, [debouncedSearch, statusFilter, animalFilter, paymentFilter]);

  async function verifyTeamAccess() {
    setAuthLoading(true);

    try {
      const data = await requestJSON(ME_API, {
        method: "GET",
      });

      const user = data.data.user;

      if (user.role !== "team") {
        setCurrentUser(user);
        setAccessDenied(true);
        toast.error("Only team members can access this page.");
        return;
      }

      setCurrentUser(user);
      setAccessDenied(false);

      await fetchBills(1);
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

  async function handleCreatedBill() {
    await fetchBills(1);
    setActiveTab("bills");
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
          description="Loading your team dashboard."
        />
      </>
    );
  }

  if (accessDenied || currentUser?.role !== "team") {
    return (
      <>
        <Toaster position="top-right" />

        <CenterStateCard
          icon={<FiSlash className="h-6 w-6" />}
          title="Team Access Required"
          description="This page is only for team members."
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
          <section className={cn(card, "overflow-hidden")}>
            <div className="p-5 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#00BC7D]/20 bg-[#00BC7D]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#008E60] sm:text-xs">
                    <FiFileText className="h-3.5 w-3.5" />
                    Team Billing
                  </div>

                  <h1 className="truncate text-2xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
                    Hasil Dashboard
                  </h1>

                  <p className="mt-2 truncate text-sm font-medium text-neutral-500">
                    {currentUser?.name || currentUser?.username}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                  <SoftBadge
                    icon={<FiGrid className="h-3.5 w-3.5" />}
                    className="border-violet-200 bg-violet-50 text-violet-700"
                  >
                    Counter {currentUser?.counterNumber || "—"}
                  </SoftBadge>

                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className={cn(
                      buttonBase,
                      buttonDanger,
                      "h-10 px-3 sm:h-11"
                    )}
                  >
                    {loggingOut ? (
                      <>
                        <FiLoader className="h-4 w-4 animate-spin" />
                        Logout
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

          <TeamTopTabs activeTab={activeTab} onChange={setActiveTab} />

          <AnimatePresence mode="wait">
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
                <MyBillsTab
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
                  resetFilters={resetFilters}
                  pagination={pagination}
                  goPreviousPage={goPreviousPage}
                  goNextPage={goNextPage}
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
                <ProfileTab currentUser={currentUser} />
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