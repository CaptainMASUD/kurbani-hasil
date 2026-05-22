"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  FiSearch,
  FiPlus,
  FiX,
  FiEdit2,
  FiTrash2,
  FiRefreshCcw,
  FiFilter,
  FiMail,
  FiPhone,
  FiLoader,
  FiAlertTriangle,
  FiMapPin,
  FiUsers,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiSlash,
  FiGrid,
  FiUserCheck,
  FiHome,
} from "react-icons/fi";

/* ==========================================================================
   API CONFIG
   ========================================================================== */

const API_ROOT = process.env.NEXT_PUBLIC_API_URL || "";

const USERS_API = `${API_ROOT}/api/admin/users`;
const ME_API = `${API_ROOT}/api/auth/me`;

const STATUS_OPTIONS = ["active", "inactive", "suspended"];
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,40}$/;

const EMPTY_CLIENT_FORM = {
  name: "",
  username: "",
  email: "",
  password: "",
  status: "active",
  phone: "",
  address: "",
  hasilLocation: "",
  totalCounters: 0,
};

/* ==========================================================================
   STYLE HELPERS
   ========================================================================== */

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const pageShell =
  "min-h-screen bg-[#F6F8F7] px-4 py-6 text-neutral-900 md:px-6 lg:px-10 lg:py-8";

const card =
  "rounded-[28px] border border-neutral-200/80 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.045)]";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

const buttonPrimary =
  "bg-[#00BC7D] text-white hover:bg-[#00A86F] shadow-[0_12px_24px_rgba(0,188,125,0.22)]";

const buttonSoft =
  "border border-neutral-200 bg-white text-neutral-700 hover:border-[#00BC7D]/40 hover:bg-[#00BC7D]/[0.05] hover:text-[#008E60]";

const buttonDanger =
  "border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100";

const input =
  "h-12 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#00BC7D] focus:bg-white focus:ring-4 focus:ring-[#00BC7D]/10";

const label =
  "mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500";

/* ==========================================================================
   FETCH HELPERS
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

/* ==========================================================================
   STATUS BADGE
   ========================================================================== */

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();

  const styles =
    s === "active"
      ? "border-[#00BC7D]/25 bg-[#00BC7D]/10 text-[#008E60]"
      : s === "suspended"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-neutral-200 bg-neutral-100 text-neutral-600";

  const dot =
    s === "active"
      ? "bg-[#00BC7D]"
      : s === "suspended"
        ? "bg-rose-500"
        : "bg-neutral-400";

  const title =
    s === "active"
      ? "Active"
      : s === "suspended"
        ? "Suspended"
        : "Inactive";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold",
        styles
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {title}
    </span>
  );
}

/* ==========================================================================
   PAGE LOADING / ACCESS CARD
   ========================================================================== */

function CenterStateCard({ icon, title, description }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F8F7] px-4">
      <div className={cn(card, "w-full max-w-md p-7 text-center sm:p-8")}>
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
  maxWidthClass = "max-w-4xl",
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
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center p-4 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.985 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative w-full overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-2xl",
              maxWidthClass
            )}
          >
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-100 bg-white/95 px-5 py-5 backdrop-blur-md sm:px-6">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00BC7D] text-white shadow-[0_12px_24px_rgba(0,188,125,0.22)]">
                  {icon}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold tracking-tight text-neutral-950">
                    {title}
                  </h2>

                  {subtitle && (
                    <p className="mt-0.5 truncate text-sm text-neutral-500">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500 transition hover:bg-[#00BC7D]/10 hover:text-[#008E60]"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-14rem)] overflow-y-auto px-5 py-5 sm:px-6">
              {children}
            </div>

            {footer && (
              <div className="sticky bottom-0 z-20 border-t border-neutral-100 bg-white/95 px-5 py-5 backdrop-blur-md sm:px-6">
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
   FORM FIELD
   ========================================================================== */

function Field({ title, children, hint }) {
  return (
    <div>
      <label className={label}>{title}</label>
      {children}
      {hint && <p className="mt-2 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

/* ==========================================================================
   CLIENT CREATE / EDIT MODAL
   ========================================================================== */

function ClientUpsertModal({
  open,
  onClose,
  mode = "create",
  initial,
  onSaved,
}) {
  const [form, setForm] = useState(EMPTY_CLIENT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) return;

    setShowPassword(false);

    if (mode === "edit" && initial) {
      setForm({
        name: initial.name || "",
        username: initial.username || "",
        email: initial.email || "",
        password: "",
        status: initial.status || "active",
        phone: initial.phone || "",
        address: initial.address || "",
        hasilLocation: initial.hasilLocation || "",
        totalCounters: initial.totalCounters ?? 0,
      });
    } else {
      setForm(EMPTY_CLIENT_FORM);
    }
  }, [open, mode, initial]);

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function buildPayload() {
    const payload = {
      name: form.name.trim(),
      username: form.username.trim().toLowerCase(),
      email: form.email.trim().toLowerCase(),
      role: "client",
      status: form.status,
      phone: form.phone.trim(),
      address: form.address.trim(),
      hasilLocation: form.hasilLocation.trim(),
      totalCounters: Number(form.totalCounters || 0),
    };

    if (mode === "create") {
      payload.password = form.password;
    }

    if (mode === "edit" && form.password.trim()) {
      payload.password = form.password;
    }

    return payload;
  }

  function validatePayload(payload) {
    if (!payload.name) return "Client name is required.";
    if (!payload.username) return "Username is required.";

    if (payload.username.length < 3) {
      return "Username must be at least 3 characters.";
    }

    if (payload.username.length > 40) {
      return "Username must be 40 characters or fewer.";
    }

    if (!USERNAME_REGEX.test(payload.username)) {
      return "Username can contain only letters, numbers, underscore, dot, and dash.";
    }

    if (!payload.email) {
      return "Client email is required.";
    }

    if (mode === "create" && !payload.password) {
      return "Password is required.";
    }

    if (payload.password && payload.password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    if (!payload.phone) {
      return "Client phone is required.";
    }

    if (!payload.address) {
      return "Client address is required.";
    }

    if (!payload.hasilLocation) {
      return "Client hasil location is required.";
    }

    if (payload.totalCounters < 0) {
      return "Total counters must be 0 or greater.";
    }

    return null;
  }

  async function submit() {
    const payload = buildPayload();
    const validationError = validatePayload(payload);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "create") {
        await requestJSON(USERS_API, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        toast.success("Client created successfully.");
      } else {
        await requestJSON(`${USERS_API}/${initial._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        toast.success("Client updated successfully.");
      }

      await onSaved();
      onClose();
    } catch (error) {
      toast.error(error?.message || "Failed to save client.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit Client Account" : "Create New Client"}
      subtitle="Manage client identity, contact, location, counters, and account state"
      icon={mode === "edit" ? <FiEdit2 /> : <FiPlus />}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            disabled={submitting}
            className={cn(buttonBase, buttonSoft)}
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={submitting}
            className={cn(buttonBase, buttonPrimary)}
          >
            {submitting ? (
              <>
                <FiLoader className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : mode === "edit" ? (
              <>
                <FiCheckCircle className="h-4 w-4" />
                Save Changes
              </>
            ) : (
              <>
                <FiPlus className="h-4 w-4" />
                Create Client
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* CLIENT IDENTITY */}
        <section className="rounded-[26px] border border-neutral-200 bg-neutral-50/70 p-4 sm:p-5">
          <div className="mb-5">
            <h3 className="text-base font-bold text-neutral-950">
              Client Identity
            </h3>

            <p className="mt-1 text-sm text-neutral-500">
              Main client account information and login credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field title="Client Name *">
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className={input}
                placeholder="Enter client name"
              />
            </Field>

            <Field
              title="Username *"
              hint="3–40 characters. Letters, numbers, underscore, dot, and dash only."
            >
              <input
                value={form.username}
                onChange={(event) =>
                  updateField("username", event.target.value)
                }
                className={input}
                placeholder="Enter username"
              />
            </Field>

            <Field title="Email Address *">
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className={input}
                placeholder="client@example.com"
              />
            </Field>

            <Field
              title={
                mode === "create"
                  ? "Password *"
                  : "New Password — Optional"
              }
            >
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  className={cn(input, "pr-12")}
                  placeholder={
                    mode === "create"
                      ? "Minimum 6 characters"
                      : "Leave empty to keep current password"
                  }
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-[#008E60]"
                >
                  {showPassword ? (
                    <FiEyeOff className="h-4 w-4" />
                  ) : (
                    <FiEye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </Field>
          </div>
        </section>

        {/* STATUS */}
        <section className="rounded-[26px] border border-neutral-200 bg-white p-4 sm:p-5">
          <div className="mb-5">
            <h3 className="text-base font-bold text-neutral-950">
              Account Status
            </h3>

            <p className="mt-1 text-sm text-neutral-500">
              Control whether this client account is active, inactive, or suspended.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field title="Client Status *">
              <select
                value={form.status}
                onChange={(event) =>
                  updateField("status", event.target.value)
                }
                className={input}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        {/* CLIENT BUSINESS DETAILS */}
        <section className="rounded-[26px] border border-blue-200 bg-blue-50/70 p-4 sm:p-5">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <FiHome />
            </div>

            <div>
              <h3 className="text-base font-bold text-neutral-950">
                Client Business Details
              </h3>

              <p className="mt-1 text-sm text-neutral-600">
                Contact, address, hasil location, and counter capacity.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field title="Phone Number *">
              <input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className={input}
                placeholder="+880 17XXXXXXXX"
              />
            </Field>

            <Field title="Total Counters *">
              <input
                type="number"
                min="0"
                value={form.totalCounters}
                onChange={(event) =>
                  updateField("totalCounters", event.target.value)
                }
                className={input}
                placeholder="0"
              />
            </Field>

            <Field title="Hasil Location *">
              <input
                value={form.hasilLocation}
                onChange={(event) =>
                  updateField("hasilLocation", event.target.value)
                }
                className={input}
                placeholder="Enter hasil location"
              />
            </Field>

            <Field title="Address *">
              <input
                value={form.address}
                onChange={(event) =>
                  updateField("address", event.target.value)
                }
                className={input}
                placeholder="Enter client address"
              />
            </Field>
          </div>
        </section>
      </div>
    </ModalShell>
  );
}

/* ==========================================================================
   DELETE CLIENT MODAL
   ========================================================================== */

function DeleteClientModal({ open, onClose, client, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!client?._id) return;

    setDeleting(true);

    try {
      await requestJSON(`${USERS_API}/${client._id}`, {
        method: "DELETE",
      });

      toast.success("Client deleted successfully.");
      await onDeleted();
      onClose();
    } catch (error) {
      toast.error(error?.message || "Failed to delete client.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Delete Client"
      subtitle="This permanently removes the selected client account"
      icon={<FiTrash2 />}
      maxWidthClass="max-w-lg"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            disabled={deleting}
            className={cn(buttonBase, buttonSoft)}
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className={cn(buttonBase, buttonDanger)}
          >
            {deleting ? (
              <>
                <FiLoader className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <FiTrash2 className="h-4 w-4" />
                Delete Client
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-5">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white">
          <FiAlertTriangle className="h-5 w-5" />
        </div>

        <h3 className="text-base font-bold text-rose-900">
          Confirm client deletion
        </h3>

        <p className="mt-2 text-sm leading-6 text-rose-700">
          You are about to delete{" "}
          <span className="font-bold">{client?.name || "this client"}</span>.
          This action cannot be undone.
        </p>

        <p className="mt-3 text-sm leading-6 text-rose-700">
          If this client still has assigned team members, the backend will block
          deletion until they are removed or reassigned.
        </p>
      </div>
    </ModalShell>
  );
}

/* ==========================================================================
   STAT CARD
   ========================================================================== */

function StatCard({ title, value, icon, accent, subtitle }) {
  return (
    <div className={cn(card, "p-5 sm:p-6")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
            {title}
          </p>

          <h3 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950">
            {value}
          </h3>

          {subtitle && (
            <p className="mt-2 text-sm text-neutral-500">{subtitle}</p>
          )}
        </div>

        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px]",
            accent
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   CLIENTS TABLE
   ========================================================================== */

function ClientsTable({
  clients,
  loadingClients,
  onEdit,
  onDelete,
}) {
  return (
    <div className={cn(card, "overflow-hidden")}>
      <div className="border-b border-neutral-100 px-5 py-5 sm:px-6">
        <h2 className="text-lg font-bold tracking-tight text-neutral-950">
          Client Directory Table
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          Manage all client accounts, locations, counters, and statuses.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/80 text-left text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-500">
              <th className="px-5 py-4 sm:px-6">Client</th>
              <th className="px-5 py-4">Contact</th>
              <th className="px-5 py-4">Hasil Location</th>
              <th className="px-5 py-4">Counters</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Address</th>
              <th className="px-5 py-4 text-right sm:px-6">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100">
            {loadingClients ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center sm:px-6">
                  <div className="inline-flex items-center gap-3 text-sm font-semibold text-neutral-500">
                    <FiLoader className="h-5 w-5 animate-spin text-[#00BC7D]" />
                    Loading clients...
                  </div>
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center sm:px-6">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#00BC7D]/10 text-[#008E60]">
                      <FiUsers className="h-6 w-6" />
                    </div>

                    <h3 className="text-base font-bold text-neutral-950">
                      No clients found
                    </h3>

                    <p className="mt-2 text-sm text-neutral-500">
                      Try changing your current search or status filter.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <motion.tr
                  key={client._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="transition hover:bg-[#00BC7D]/[0.035]"
                >
                  {/* CLIENT */}
                  <td className="px-5 py-5 align-top sm:px-6">
                    <div className="flex min-w-[220px] items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-sm font-bold text-white">
                        {getInitials(client.name)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-neutral-950">
                          {client.name}
                        </p>

                        <p className="mt-1 truncate text-sm font-medium text-neutral-500">
                          @{client.username}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* CONTACT */}
                  <td className="px-5 py-5 align-top">
                    <div className="min-w-[220px] space-y-2 text-sm text-neutral-600">
                      <div className="flex items-start gap-2">
                        <FiMail className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                        <span className="break-all">
                          {client.email || "No email"}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <FiPhone className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                        <span>{client.phone || "No phone"}</span>
                      </div>
                    </div>
                  </td>

                  {/* LOCATION */}
                  <td className="px-5 py-5 align-top">
                    <div className="min-w-[180px] text-sm text-neutral-600">
                      <div className="flex items-start gap-2">
                        <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                        <span>{client.hasilLocation || "No location"}</span>
                      </div>
                    </div>
                  </td>

                  {/* COUNTERS */}
                  <td className="px-5 py-5 align-top">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                      <FiGrid className="h-3.5 w-3.5" />
                      {client.totalCounters ?? 0} Counters
                    </div>
                  </td>

                  {/* STATUS */}
                  <td className="px-5 py-5 align-top">
                    <StatusBadge status={client.status} />
                  </td>

                  {/* ADDRESS */}
                  <td className="px-5 py-5 align-top">
                    <div className="min-w-[220px] text-sm text-neutral-600">
                      {client.address || "No address"}
                    </div>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-5 py-5 text-right align-top sm:px-6">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onEdit(client)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#00BC7D]/20 bg-[#00BC7D]/10 text-[#008E60] transition hover:bg-[#00BC7D]/20"
                        title="Edit client"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onDelete(client)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                        title="Delete client"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export default function ClientDirectorySection() {
  const [authLoading, setAuthLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [upsertOpen, setUpsertOpen] = useState(false);
  const [upsertMode, setUpsertMode] = useState("create");
  const [selectedClient, setSelectedClient] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteClientTarget, setDeleteClientTarget] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    verifyAdmin();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (currentUser?.role === "admin") {
      fetchClients(1);
    }
  }, [debouncedSearch, statusFilter]);

  const visibleActiveClients = clients.filter(
    (client) => String(client.status).toLowerCase() === "active"
  ).length;

  const visibleSuspendedClients = clients.filter(
    (client) => String(client.status).toLowerCase() === "suspended"
  ).length;

  const visibleCounters = clients.reduce(
    (sum, client) => sum + Number(client.totalCounters || 0),
    0
  );

  async function verifyAdmin() {
    setAuthLoading(true);

    try {
      const data = await requestJSON(ME_API, {
        method: "GET",
      });

      const user = data.data.user;

      if (user.role !== "admin") {
        setCurrentUser(user);
        setAccessDenied(true);
        toast.error("Only admin users can access this page.");
        return;
      }

      setCurrentUser(user);
      setAccessDenied(false);

      await fetchClients(1);
    } catch (error) {
      setAccessDenied(true);
      toast.error(error?.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function fetchClients(page = 1) {
    setLoadingClients(true);

    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(pagination.limit));
      params.set("role", "client");

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);

      const data = await requestJSON(`${USERS_API}?${params.toString()}`, {
        method: "GET",
      });

      setClients(data.data.items || []);
      setPagination(data.data.pagination);
    } catch (error) {
      toast.error(error?.message || "Failed to fetch clients.");
    } finally {
      setLoadingClients(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await fetchClients(pagination.page);
      toast.success("Client directory refreshed.");
    } finally {
      setRefreshing(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
  }

  function openCreateModal() {
    setUpsertMode("create");
    setSelectedClient(null);
    setUpsertOpen(true);
  }

  function openEditModal(client) {
    setUpsertMode("edit");
    setSelectedClient(client);
    setUpsertOpen(true);
  }

  function openDeleteModal(client) {
    setDeleteClientTarget(client);
    setDeleteOpen(true);
  }

  async function handleSaved() {
    await fetchClients(pagination.page);
  }

  async function handleDeleted() {
    const nextPage =
      clients.length === 1 && pagination.page > 1
        ? pagination.page - 1
        : pagination.page;

    await fetchClients(nextPage);
  }

  function goPreviousPage() {
    if (!pagination.hasPrevPage) return;
    fetchClients(pagination.page - 1);
  }

  function goNextPage() {
    if (!pagination.hasNextPage) return;
    fetchClients(pagination.page + 1);
  }

  if (authLoading) {
    return (
      <>
        <Toaster position="top-right" />

        <CenterStateCard
          icon={<FiLoader className="h-6 w-6 animate-spin" />}
          title="Verifying Admin Access"
          description="Checking your authenticated session and client management permissions."
        />
      </>
    );
  }

  if (accessDenied || currentUser?.role !== "admin") {
    return (
      <>
        <Toaster position="top-right" />

        <CenterStateCard
          icon={<FiSlash className="h-6 w-6" />}
          title="Admin Access Required"
          description="This client management dashboard is available only to authenticated admin accounts."
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
        <div className="mx-auto max-w-7xl space-y-6">
          {/* HERO HEADER */}
          <section className={cn(card, "overflow-hidden")}>
            <div className="relative p-6 sm:p-8">
              <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[#00BC7D]/10 blur-3xl" />
              <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-blue-100/70 blur-3xl" />

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00BC7D]/20 bg-[#00BC7D]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#008E60]">
                    <FiUsers className="h-3.5 w-3.5" />
                    Client Management
                  </div>

                  <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
                    Client Control Center
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base">
                    Create, update, filter, and manage all client accounts,
                    locations, counters, and account statuses from one dashboard.
                  </p>

                  <p className="mt-3 text-sm font-medium text-neutral-500">
                    Signed in as{" "}
                    <span className="font-bold text-[#008E60]">
                      {currentUser?.name || currentUser?.username}
                    </span>
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className={cn(buttonBase, buttonSoft)}
                  >
                    <FiRefreshCcw
                      className={cn(
                        "h-4 w-4",
                        refreshing && "animate-spin"
                      )}
                    />
                    Refresh
                  </button>

                  <button
                    onClick={openCreateModal}
                    className={cn(buttonBase, buttonPrimary)}
                  >
                    <FiPlus className="h-4 w-4" />
                    Add New Client
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* STATS */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Matched Clients"
              value={pagination.total}
              subtitle="Total client records after filters"
              accent="bg-[#00BC7D] text-white shadow-[0_14px_30px_rgba(0,188,125,0.22)]"
              icon={<FiUsers className="h-6 w-6" />}
            />

            <StatCard
              title="Active Visible"
              value={visibleActiveClients}
              subtitle="Active clients on this page"
              accent="bg-[#00BC7D]/10 text-[#008E60]"
              icon={<FiUserCheck className="h-6 w-6" />}
            />

            <StatCard
              title="Suspended Visible"
              value={visibleSuspendedClients}
              subtitle="Suspended clients on this page"
              accent="bg-rose-100 text-rose-700"
              icon={<FiAlertTriangle className="h-6 w-6" />}
            />

            <StatCard
              title="Visible Counters"
              value={visibleCounters}
              subtitle="Total counters on this page"
              accent="bg-blue-100 text-blue-700"
              icon={<FiGrid className="h-6 w-6" />}
            />
          </section>

          {/* FILTERS */}
          <section className={cn(card, "p-5 sm:p-6")}>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00BC7D] text-white shadow-[0_12px_24px_rgba(0,188,125,0.2)]">
                <FiFilter className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-bold text-neutral-950">
                  Search & Filter Clients
                </h2>

                <p className="text-sm text-neutral-500">
                  Filter the client table by keyword or account status.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_0.7fr_auto]">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, username, email, phone, location..."
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

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className={input}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>

              <button
                onClick={resetFilters}
                className={cn(buttonBase, buttonSoft)}
              >
                Reset
              </button>
            </div>
          </section>

          {/* CLIENTS TABLE */}
          <ClientsTable
            clients={clients}
            loadingClients={loadingClients}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
          />

          {/* PAGINATION */}
          <section
            className={cn(
              card,
              "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
            )}
          >
            <p className="text-sm font-medium text-neutral-500">
              Showing{" "}
              <span className="font-bold text-neutral-950">
                {clients.length}
              </span>{" "}
              clients on page{" "}
              <span className="font-bold text-neutral-950">
                {pagination.page}
              </span>{" "}
              of{" "}
              <span className="font-bold text-neutral-950">
                {pagination.totalPages || 1}
              </span>
              . Total matched records:{" "}
              <span className="font-bold text-neutral-950">
                {pagination.total}
              </span>
              .
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={goPreviousPage}
                disabled={!pagination.hasPrevPage}
                className={cn(buttonBase, buttonSoft)}
              >
                <FiChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                onClick={goNextPage}
                disabled={!pagination.hasNextPage}
                className={cn(buttonBase, buttonSoft)}
              >
                Next
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* CREATE / EDIT CLIENT MODAL */}
      <AnimatePresence>
        {upsertOpen && (
          <ClientUpsertModal
            open={upsertOpen}
            onClose={() => setUpsertOpen(false)}
            mode={upsertMode}
            initial={selectedClient}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      {/* DELETE CLIENT MODAL */}
      <AnimatePresence>
        {deleteOpen && (
          <DeleteClientModal
            open={deleteOpen}
            onClose={() => {
              setDeleteOpen(false);
              setDeleteClientTarget(null);
            }}
            client={deleteClientTarget}
            onDeleted={handleDeleted}
          />
        )}
      </AnimatePresence>
    </>
  );
}