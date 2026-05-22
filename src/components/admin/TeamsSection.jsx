"use client";

import { useEffect, useMemo, useState } from "react";
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
  FiBriefcase,
  FiHash,
  FiLayers,
} from "react-icons/fi";

/* ==========================================================================
   API CONFIG
   ========================================================================== */

const API_ROOT = process.env.NEXT_PUBLIC_API_URL || "";

const USERS_API = `${API_ROOT}/api/admin/users`;
const ME_API = `${API_ROOT}/api/auth/me`;

const STATUS_OPTIONS = ["active", "inactive", "suspended"];
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,40}$/;

const EMPTY_TEAM_FORM = {
  name: "",
  username: "",
  email: "",
  password: "",
  status: "active",
  phone: "",
  clientId: "",
  counterNumber: "",
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

function buildCounterOptions(totalCounters = 0) {
  const count = Number(totalCounters || 0);

  if (!Number.isInteger(count) || count < 1) {
    return [];
  }

  return Array.from({ length: count }, (_, index) => index + 1);
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
   COUNTER BADGE
   ========================================================================== */

function CounterBadge({ counterNumber }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
      <FiHash className="h-3.5 w-3.5" />
      Counter {counterNumber || "-"}
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
   TEAM CREATE / EDIT MODAL
   ========================================================================== */

function TeamUpsertModal({
  open,
  onClose,
  mode = "create",
  initial,
  clients,
  onSaved,
}) {
  const [form, setForm] = useState(EMPTY_TEAM_FORM);
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
        clientId:
          typeof initial.client === "object"
            ? initial.client?._id || ""
            : initial.client || "",
        counterNumber: initial.counterNumber || "",
      });
    } else {
      setForm(EMPTY_TEAM_FORM);
    }
  }, [open, mode, initial]);

  const selectedClient = useMemo(() => {
    return clients.find((client) => client._id === form.clientId) || null;
  }, [clients, form.clientId]);

  const counterOptions = useMemo(() => {
    return buildCounterOptions(selectedClient?.totalCounters || 0);
  }, [selectedClient]);

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleClientChange(clientId) {
    const chosenClient = clients.find((client) => client._id === clientId);

    setForm((prev) => ({
      ...prev,
      clientId,
      counterNumber:
        chosenClient?.totalCounters > 0 ? prev.counterNumber : "",
    }));

    if (
      chosenClient &&
      Number(prevSafeCounterValue(form.counterNumber)) >
        Number(chosenClient.totalCounters || 0)
    ) {
      setForm((prev) => ({
        ...prev,
        clientId,
        counterNumber: "",
      }));
    }
  }

  function prevSafeCounterValue(value) {
    const number = Number(value);
    return Number.isInteger(number) ? number : 0;
  }

  function buildPayload() {
    const payload = {
      name: form.name.trim(),
      username: form.username.trim().toLowerCase(),
      email: form.email.trim().toLowerCase(),
      role: "team",
      status: form.status,
      phone: form.phone.trim(),
      clientId: form.clientId,
      counterNumber: Number(form.counterNumber || 0),
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
    if (!payload.name) return "Team member name is required.";
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

    if (mode === "create" && !payload.password) {
      return "Password is required.";
    }

    if (payload.password && payload.password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    if (!payload.clientId) {
      return "Please select a client.";
    }

    if (!selectedClient) {
      return "Selected client was not found.";
    }

    if (!selectedClient.totalCounters || selectedClient.totalCounters < 1) {
      return "This client has no counters configured.";
    }

    if (!payload.counterNumber || payload.counterNumber < 1) {
      return "Please select a valid counter.";
    }

    if (payload.counterNumber > selectedClient.totalCounters) {
      return `Counter number cannot exceed client's total counters (${selectedClient.totalCounters}).`;
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

        toast.success("Team member created successfully.");
      } else {
        await requestJSON(`${USERS_API}/${initial._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        toast.success("Team member updated successfully.");
      }

      await onSaved();
      onClose();
    } catch (error) {
      toast.error(error?.message || "Failed to save team member.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit Team Member" : "Create Team Member"}
      subtitle="Manage team identity, login, client assignment, and counter placement"
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
                Create Team Member
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* TEAM IDENTITY */}
        <section className="rounded-[26px] border border-neutral-200 bg-neutral-50/70 p-4 sm:p-5">
          <div className="mb-5">
            <h3 className="text-base font-bold text-neutral-950">
              Team Member Identity
            </h3>

            <p className="mt-1 text-sm text-neutral-500">
              Main account information and login credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field title="Team Member Name *">
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className={input}
                placeholder="Enter team member name"
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

            <Field title="Email Address — Optional">
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className={input}
                placeholder="member@example.com"
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

        {/* ACCOUNT DETAILS */}
        <section className="rounded-[26px] border border-neutral-200 bg-white p-4 sm:p-5">
          <div className="mb-5">
            <h3 className="text-base font-bold text-neutral-950">
              Account & Contact
            </h3>

            <p className="mt-1 text-sm text-neutral-500">
              Manage team member status and optional contact number.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field title="Team Status *">
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

            <Field title="Phone Number — Optional">
              <input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className={input}
                placeholder="+880 17XXXXXXXX"
              />
            </Field>
          </div>
        </section>

        {/* CLIENT + COUNTER ASSIGNMENT */}
        <section className="rounded-[26px] border border-violet-200 bg-violet-50/70 p-4 sm:p-5">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white">
              <FiLayers />
            </div>

            <div>
              <h3 className="text-base font-bold text-neutral-950">
                Client & Counter Assignment
              </h3>

              <p className="mt-1 text-sm text-neutral-600">
                Assign this team member under a client and choose a counter.
                Multiple members can work under the same counter.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field title="Assigned Client *">
              <select
                value={form.clientId}
                onChange={(event) => handleClientChange(event.target.value)}
                className={input}
              >
                <option value="">Select client</option>

                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name} — {client.totalCounters || 0} Counters
                  </option>
                ))}
              </select>
            </Field>

            <Field title="Assigned Counter *">
              <select
                value={form.counterNumber}
                onChange={(event) =>
                  updateField("counterNumber", event.target.value)
                }
                className={input}
                disabled={!selectedClient || counterOptions.length === 0}
              >
                <option value="">
                  {!selectedClient
                    ? "Select client first"
                    : counterOptions.length === 0
                      ? "No counters available"
                      : "Select counter"}
                </option>

                {counterOptions.map((counter) => (
                  <option key={counter} value={counter}>
                    Counter {counter}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {selectedClient && (
            <div className="mt-5 rounded-[22px] border border-violet-200 bg-white/80 p-4">
              <div className="grid grid-cols-1 gap-3 text-sm text-neutral-600 md:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
                    Client
                  </p>
                  <p className="mt-1 font-bold text-neutral-950">
                    {selectedClient.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
                    Total Counters
                  </p>
                  <p className="mt-1 font-bold text-neutral-950">
                    {selectedClient.totalCounters || 0}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
                    Selected Counter
                  </p>
                  <p className="mt-1 font-bold text-neutral-950">
                    {form.counterNumber
                      ? `Counter ${form.counterNumber}`
                      : "Not selected"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </ModalShell>
  );
}

/* ==========================================================================
   DELETE TEAM MODAL
   ========================================================================== */

function DeleteTeamModal({ open, onClose, teamMember, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!teamMember?._id) return;

    setDeleting(true);

    try {
      await requestJSON(`${USERS_API}/${teamMember._id}`, {
        method: "DELETE",
      });

      toast.success("Team member deleted successfully.");
      await onDeleted();
      onClose();
    } catch (error) {
      toast.error(error?.message || "Failed to delete team member.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Delete Team Member"
      subtitle="This permanently removes the selected team account"
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
                Delete Team Member
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
          Confirm team member deletion
        </h3>

        <p className="mt-2 text-sm leading-6 text-rose-700">
          You are about to delete{" "}
          <span className="font-bold">
            {teamMember?.name || "this team member"}
          </span>
          . This action cannot be undone.
        </p>

        {teamMember?.client && (
          <p className="mt-3 text-sm leading-6 text-rose-700">
            Assigned client:{" "}
            <span className="font-bold">
              {teamMember.client?.name || "Unknown client"}
            </span>
            , Counter{" "}
            <span className="font-bold">
              {teamMember.counterNumber || "-"}
            </span>
            .
          </p>
        )}
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
   TEAM TABLE
   ========================================================================== */

function TeamTable({
  teamMembers,
  loadingTeams,
  onEdit,
  onDelete,
}) {
  return (
    <div className={cn(card, "overflow-hidden")}>
      <div className="border-b border-neutral-100 px-5 py-5 sm:px-6">
        <h2 className="text-lg font-bold tracking-tight text-neutral-950">
          Team Directory Table
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          Manage team accounts, assigned clients, counters, and statuses.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/80 text-left text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-500">
              <th className="px-5 py-4 sm:px-6">Team Member</th>
              <th className="px-5 py-4">Contact</th>
              <th className="px-5 py-4">Assigned Client</th>
              <th className="px-5 py-4">Counter</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right sm:px-6">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100">
            {loadingTeams ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center sm:px-6">
                  <div className="inline-flex items-center gap-3 text-sm font-semibold text-neutral-500">
                    <FiLoader className="h-5 w-5 animate-spin text-[#00BC7D]" />
                    Loading team members...
                  </div>
                </td>
              </tr>
            ) : teamMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center sm:px-6">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#00BC7D]/10 text-[#008E60]">
                      <FiUsers className="h-6 w-6" />
                    </div>

                    <h3 className="text-base font-bold text-neutral-950">
                      No team members found
                    </h3>

                    <p className="mt-2 text-sm text-neutral-500">
                      Try changing your search or current filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              teamMembers.map((member) => (
                <motion.tr
                  key={member._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="transition hover:bg-[#00BC7D]/[0.035]"
                >
                  {/* TEAM MEMBER */}
                  <td className="px-5 py-5 align-top sm:px-6">
                    <div className="flex min-w-[220px] items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00BC7D] text-sm font-bold text-white">
                        {getInitials(member.name)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-neutral-950">
                          {member.name}
                        </p>

                        <p className="mt-1 truncate text-sm font-medium text-neutral-500">
                          @{member.username}
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
                          {member.email || "No email"}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <FiPhone className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                        <span>{member.phone || "No phone"}</span>
                      </div>
                    </div>
                  </td>

                  {/* CLIENT */}
                  <td className="px-5 py-5 align-top">
                    <div className="min-w-[220px]">
                      <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                        <FiBriefcase className="h-3.5 w-3.5" />
                        {member.client?.name || "No client"}
                      </div>

                      {member.client?.username && (
                        <p className="mt-2 text-sm font-medium text-neutral-500">
                          @{member.client.username}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* COUNTER */}
                  <td className="px-5 py-5 align-top">
                    <CounterBadge counterNumber={member.counterNumber} />
                  </td>

                  {/* STATUS */}
                  <td className="px-5 py-5 align-top">
                    <StatusBadge status={member.status} />
                  </td>

                  {/* ACTIONS */}
                  <td className="px-5 py-5 text-right align-top sm:px-6">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onEdit(member)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#00BC7D]/20 bg-[#00BC7D]/10 text-[#008E60] transition hover:bg-[#00BC7D]/20"
                        title="Edit team member"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onDelete(member)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                        title="Delete team member"
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

export default function TeamDirectorySection() {
  const [authLoading, setAuthLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [teamMembers, setTeamMembers] = useState([]);
  const [clients, setClients] = useState([]);

  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [counterFilter, setCounterFilter] = useState("");

  const [upsertOpen, setUpsertOpen] = useState(false);
  const [upsertMode, setUpsertMode] = useState("create");
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTeamTarget, setDeleteTeamTarget] = useState(null);

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
      fetchTeamMembers(1);
    }
  }, [debouncedSearch, statusFilter, clientFilter, counterFilter]);

  const selectedFilterClient = useMemo(() => {
    return clients.find((client) => client._id === clientFilter) || null;
  }, [clients, clientFilter]);

  const availableCounterFilterOptions = useMemo(() => {
    return buildCounterOptions(selectedFilterClient?.totalCounters || 0);
  }, [selectedFilterClient]);

  const visibleActiveTeams = teamMembers.filter(
    (member) => String(member.status).toLowerCase() === "active"
  ).length;

  const visibleSuspendedTeams = teamMembers.filter(
    (member) => String(member.status).toLowerCase() === "suspended"
  ).length;

  const visibleAssignedClients = new Set(
    teamMembers
      .map((member) => member.client?._id || member.client)
      .filter(Boolean)
  ).size;

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

      await Promise.all([fetchClients(), fetchTeamMembers(1)]);
    } catch (error) {
      setAccessDenied(true);
      toast.error(error?.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function fetchClients() {
    setLoadingClients(true);

    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "100");
      params.set("role", "client");

      const data = await requestJSON(`${USERS_API}?${params.toString()}`, {
        method: "GET",
      });

      setClients(data.data.items || []);
    } catch (error) {
      toast.error(error?.message || "Failed to fetch clients.");
    } finally {
      setLoadingClients(false);
    }
  }

  async function fetchTeamMembers(page = 1) {
    setLoadingTeams(true);

    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(pagination.limit));
      params.set("role", "team");

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);
      if (clientFilter) params.set("clientId", clientFilter);
      if (counterFilter) params.set("counterNumber", counterFilter);

      const data = await requestJSON(`${USERS_API}?${params.toString()}`, {
        method: "GET",
      });

      setTeamMembers(data.data.items || []);
      setPagination(data.data.pagination);
    } catch (error) {
      toast.error(error?.message || "Failed to fetch team members.");
    } finally {
      setLoadingTeams(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await Promise.all([
        fetchClients(),
        fetchTeamMembers(pagination.page),
      ]);

      toast.success("Team directory refreshed.");
    } finally {
      setRefreshing(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setClientFilter("");
    setCounterFilter("");
  }

  function handleClientFilterChange(value) {
    setClientFilter(value);
    setCounterFilter("");
  }

  function openCreateModal() {
    setUpsertMode("create");
    setSelectedTeamMember(null);
    setUpsertOpen(true);
  }

  function openEditModal(teamMember) {
    setUpsertMode("edit");
    setSelectedTeamMember(teamMember);
    setUpsertOpen(true);
  }

  function openDeleteModal(teamMember) {
    setDeleteTeamTarget(teamMember);
    setDeleteOpen(true);
  }

  async function handleSaved() {
    await fetchTeamMembers(pagination.page);
  }

  async function handleDeleted() {
    const nextPage =
      teamMembers.length === 1 && pagination.page > 1
        ? pagination.page - 1
        : pagination.page;

    await fetchTeamMembers(nextPage);
  }

  function goPreviousPage() {
    if (!pagination.hasPrevPage) return;
    fetchTeamMembers(pagination.page - 1);
  }

  function goNextPage() {
    if (!pagination.hasNextPage) return;
    fetchTeamMembers(pagination.page + 1);
  }

  if (authLoading) {
    return (
      <>
        <Toaster position="top-right" />

        <CenterStateCard
          icon={<FiLoader className="h-6 w-6 animate-spin" />}
          title="Verifying Admin Access"
          description="Checking your authenticated session and team management permissions."
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
          description="This team management dashboard is available only to authenticated admin accounts."
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
              <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-violet-100/70 blur-3xl" />

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00BC7D]/20 bg-[#00BC7D]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#008E60]">
                    <FiUsers className="h-3.5 w-3.5" />
                    Team Management
                  </div>

                  <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
                    Team Control Center
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base">
                    Create, update, assign, and manage all team members under
                    client counters from one modern admin dashboard.
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
                    disabled={loadingClients}
                  >
                    <FiPlus className="h-4 w-4" />
                    Add Team Member
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* STATS */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Matched Members"
              value={pagination.total}
              subtitle="Total team records after filters"
              accent="bg-[#00BC7D] text-white shadow-[0_14px_30px_rgba(0,188,125,0.22)]"
              icon={<FiUsers className="h-6 w-6" />}
            />

            <StatCard
              title="Active Visible"
              value={visibleActiveTeams}
              subtitle="Active members on this page"
              accent="bg-[#00BC7D]/10 text-[#008E60]"
              icon={<FiUserCheck className="h-6 w-6" />}
            />

            <StatCard
              title="Suspended Visible"
              value={visibleSuspendedTeams}
              subtitle="Suspended members on this page"
              accent="bg-rose-100 text-rose-700"
              icon={<FiAlertTriangle className="h-6 w-6" />}
            />

            <StatCard
              title="Visible Clients"
              value={visibleAssignedClients}
              subtitle="Clients represented on this page"
              accent="bg-violet-100 text-violet-700"
              icon={<FiBriefcase className="h-6 w-6" />}
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
                  Search & Filter Team Members
                </h2>

                <p className="text-sm text-neutral-500">
                  Filter by keyword, status, assigned client, and counter.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.72fr_0.85fr_0.7fr_auto]">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, username, email, phone..."
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

              <select
                value={clientFilter}
                onChange={(event) =>
                  handleClientFilterChange(event.target.value)
                }
                className={input}
              >
                <option value="">All Clients</option>

                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>

              <select
                value={counterFilter}
                onChange={(event) => setCounterFilter(event.target.value)}
                className={input}
                disabled={!clientFilter}
              >
                <option value="">
                  {!clientFilter ? "Select client first" : "All Counters"}
                </option>

                {availableCounterFilterOptions.map((counter) => (
                  <option key={counter} value={counter}>
                    Counter {counter}
                  </option>
                ))}
              </select>

              <button
                onClick={resetFilters}
                className={cn(buttonBase, buttonSoft)}
              >
                Reset
              </button>
            </div>
          </section>

          {/* TEAM TABLE */}
          <TeamTable
            teamMembers={teamMembers}
            loadingTeams={loadingTeams}
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
                {teamMembers.length}
              </span>{" "}
              team members on page{" "}
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

      {/* CREATE / EDIT TEAM MODAL */}
      <AnimatePresence>
        {upsertOpen && (
          <TeamUpsertModal
            open={upsertOpen}
            onClose={() => setUpsertOpen(false)}
            mode={upsertMode}
            initial={selectedTeamMember}
            clients={clients}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      {/* DELETE TEAM MODAL */}
      <AnimatePresence>
        {deleteOpen && (
          <DeleteTeamModal
            open={deleteOpen}
            onClose={() => {
              setDeleteOpen(false);
              setDeleteTeamTarget(null);
            }}
            teamMember={deleteTeamTarget}
            onDeleted={handleDeleted}
          />
        )}
      </AnimatePresence>
    </>
  );
}