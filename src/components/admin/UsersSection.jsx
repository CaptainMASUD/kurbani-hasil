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
  FiShield,
  FiLoader,
  FiAlertTriangle,
  FiMapPin,
  FiUsers,
  FiHash,
  FiUser,
  FiBriefcase,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiSlash,
  FiGrid,
  FiUserCheck,
} from "react-icons/fi";

/* ==========================================================================
   API CONFIG
   ========================================================================== */

const API_ROOT = process.env.NEXT_PUBLIC_API_URL || "";

const USERS_API = `${API_ROOT}/api/admin/users`;
const ME_API = `${API_ROOT}/api/auth/me`;

const ROLE_OPTIONS = ["admin", "client", "team"];
const STATUS_OPTIONS = ["active", "inactive", "suspended"];

const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,40}$/;

const EMPTY_FORM = {
  name: "",
  username: "",
  email: "",
  password: "",
  role: "client",
  status: "active",

  phone: "",
  address: "",
  hasilLocation: "",
  totalCounters: 0,

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

function getClientIdFromUser(user) {
  if (!user?.client) return "";
  return user.client._id || user.client.id || "";
}

/* ==========================================================================
   BADGES
   ========================================================================== */

function RoleBadge({ role }) {
  const r = String(role || "").toLowerCase();

  const styles =
    r === "admin"
      ? "border-violet-200 bg-violet-50 text-violet-700"
      : r === "client"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-orange-200 bg-orange-50 text-orange-700";

  const title =
    r === "admin" ? "Admin" : r === "client" ? "Client" : "Team";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold",
        styles
      )}
    >
      <FiShield className="h-3.5 w-3.5" />
      {title}
    </span>
  );
}

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
   CREATE / EDIT USER MODAL
   ========================================================================== */

function UserUpsertModal({
  open,
  onClose,
  mode = "create",
  initial,
  clients,
  onSaved,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
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
        role: initial.role || "client",
        status: initial.status || "active",

        phone: initial.phone || "",
        address: initial.address || "",
        hasilLocation: initial.hasilLocation || "",
        totalCounters: initial.totalCounters ?? 0,

        clientId: getClientIdFromUser(initial),
        counterNumber: initial.counterNumber || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, mode, initial]);

  const selectedClient = useMemo(() => {
    return clients.find((client) => client._id === form.clientId);
  }, [clients, form.clientId]);

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleRoleChange(role) {
    setForm((prev) => ({
      ...prev,
      role,

      phone: role === "admin" ? "" : prev.phone,

      address: role === "client" ? prev.address : "",
      hasilLocation: role === "client" ? prev.hasilLocation : "",
      totalCounters: role === "client" ? prev.totalCounters : 0,

      clientId: role === "team" ? prev.clientId : "",
      counterNumber: role === "team" ? prev.counterNumber : "",
    }));
  }

  function buildPayload() {
    const payload = {
      name: form.name.trim(),
      username: form.username.trim().toLowerCase(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      status: form.status,
    };

    if (mode === "create") {
      payload.password = form.password;
    }

    if (mode === "edit" && form.password.trim()) {
      payload.password = form.password;
    }

    if (form.role === "client") {
      payload.phone = form.phone.trim();
      payload.address = form.address.trim();
      payload.hasilLocation = form.hasilLocation.trim();
      payload.totalCounters = Number(form.totalCounters || 0);
    }

    if (form.role === "team") {
      payload.phone = form.phone.trim();
      payload.clientId = form.clientId;
      payload.counterNumber = Number(form.counterNumber || 0);
    }

    return payload;
  }

  function validatePayload(payload) {
    if (!payload.name) return "Name is required.";
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

    if (!payload.role) return "Role is required.";

    if (mode === "create" && !payload.password) {
      return "Password is required.";
    }

    if (payload.password && payload.password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    if (
      (payload.role === "admin" || payload.role === "client") &&
      !payload.email
    ) {
      return "Email is required for admin and client.";
    }

    if (payload.role === "client") {
      if (!payload.phone) return "Client phone is required.";
      if (!payload.address) return "Client address is required.";
      if (!payload.hasilLocation) return "Client hasil location is required.";

      if (payload.totalCounters < 0) {
        return "Total counters must be 0 or greater.";
      }
    }

    if (payload.role === "team") {
      if (!payload.clientId) {
        return "Please select a client for the team member.";
      }

      if (!payload.counterNumber || payload.counterNumber < 1) {
        return "Valid counter number is required.";
      }

      if (
        selectedClient?.totalCounters > 0 &&
        payload.counterNumber > selectedClient.totalCounters
      ) {
        return `Counter number cannot exceed ${selectedClient.totalCounters}.`;
      }
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

        toast.success("User created successfully.");
      } else {
        await requestJSON(`${USERS_API}/${initial._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        toast.success("User updated successfully.");
      }

      await onSaved();
      onClose();
    } catch (error) {
      toast.error(error?.message || "Failed to save user.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit User Account" : "Create New User"}
      subtitle="Manage identity information, role-specific fields, and account access"
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
                Create User
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* BASIC ACCOUNT */}
        <section className="rounded-[26px] border border-neutral-200 bg-neutral-50/70 p-4 sm:p-5">
          <div className="mb-5">
            <h3 className="text-base font-bold text-neutral-950">
              Basic Account Information
            </h3>

            <p className="mt-1 text-sm text-neutral-500">
              These fields define the user's identity and authentication.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field title="Full Name *">
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className={input}
                placeholder="Enter full name"
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

            <Field title="Email Address">
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className={input}
                placeholder="name@domain.com"
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

        {/* ROLE STATUS */}
        <section className="rounded-[26px] border border-neutral-200 bg-white p-4 sm:p-5">
          <div className="mb-5">
            <h3 className="text-base font-bold text-neutral-950">
              Role & Account State
            </h3>

            <p className="mt-1 text-sm text-neutral-500">
              Choose the user type and whether they can log in.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field title="Role *">
              <select
                value={form.role}
                onChange={(event) => handleRoleChange(event.target.value)}
                className={input}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </Field>

            <Field title="Status *">
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

        {/* CLIENT FIELDS */}
        {form.role === "client" && (
          <section className="rounded-[26px] border border-blue-200 bg-blue-50/70 p-4 sm:p-5">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <FiUser />
              </div>

              <div>
                <h3 className="text-base font-bold text-neutral-950">
                  Client Details
                </h3>

                <p className="mt-1 text-sm text-neutral-600">
                  Required fields for a client account.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field title="Phone Number *">
                <input
                  value={form.phone}
                  onChange={(event) =>
                    updateField("phone", event.target.value)
                  }
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
        )}

        {/* TEAM FIELDS */}
        {form.role === "team" && (
          <section className="rounded-[26px] border border-orange-200 bg-orange-50/70 p-4 sm:p-5">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white">
                <FiBriefcase />
              </div>

              <div>
                <h3 className="text-base font-bold text-neutral-950">
                  Team Assignment
                </h3>

                <p className="mt-1 text-sm text-neutral-600">
                  Team users must be linked to a client and valid counter.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field title="Phone Number">
                <input
                  value={form.phone}
                  onChange={(event) =>
                    updateField("phone", event.target.value)
                  }
                  className={input}
                  placeholder="+880 17XXXXXXXX"
                />
              </Field>

              <Field title="Assign Client *">
                <select
                  value={form.clientId}
                  onChange={(event) =>
                    updateField("clientId", event.target.value)
                  }
                  className={input}
                >
                  <option value="">Select client</option>

                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name} — @{client.username}
                    </option>
                  ))}
                </select>
              </Field>

              <Field title="Counter Number *">
                <input
                  type="number"
                  min="1"
                  value={form.counterNumber}
                  onChange={(event) =>
                    updateField("counterNumber", event.target.value)
                  }
                  className={input}
                  placeholder="Enter counter number"
                />
              </Field>

              <Field title="Selected Client Capacity">
                <div className="flex h-12 items-center rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-700">
                  {selectedClient ? (
                    <>
                      <FiHash className="mr-2 h-4 w-4 text-neutral-400" />
                      Maximum counters:
                      <span className="ml-1 font-bold text-neutral-950">
                        {selectedClient.totalCounters ?? 0}
                      </span>
                    </>
                  ) : (
                    <span className="text-neutral-400">
                      No client selected
                    </span>
                  )}
                </div>
              </Field>
            </div>
          </section>
        )}
      </div>
    </ModalShell>
  );
}

/* ==========================================================================
   DELETE MODAL
   ========================================================================== */

function DeleteUserModal({ open, onClose, user, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!user?._id) return;

    setDeleting(true);

    try {
      await requestJSON(`${USERS_API}/${user._id}`, {
        method: "DELETE",
      });

      toast.success("User deleted successfully.");
      await onDeleted();
      onClose();
    } catch (error) {
      toast.error(error?.message || "Failed to delete user.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Delete User"
      subtitle="This action permanently removes the selected account"
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
                Delete User
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
          Confirm account deletion
        </h3>

        <p className="mt-2 text-sm leading-6 text-rose-700">
          You are about to delete{" "}
          <span className="font-bold">{user?.name || "this user"}</span>. This
          cannot be undone.
        </p>

        <p className="mt-3 text-sm leading-6 text-rose-700">
          A client account that still has assigned team members cannot be
          deleted until those team members are removed or reassigned.
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
   USERS TABLE
   ========================================================================== */

function UsersTable({
  users,
  loadingUsers,
  onEdit,
  onDelete,
}) {
  return (
    <div className={cn(card, "overflow-hidden")}>
      <div className="border-b border-neutral-100 px-5 py-5 sm:px-6">
        <h2 className="text-lg font-bold tracking-tight text-neutral-950">
          User Directory Table
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          All fetched users are displayed here with role-specific details.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/80 text-left text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-500">
              <th className="px-5 py-4 sm:px-6">User</th>
              <th className="px-5 py-4">Contact</th>
              <th className="px-5 py-4">Role</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Assignment / Details</th>
              <th className="px-5 py-4 text-right sm:px-6">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100">
            {loadingUsers ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center sm:px-6">
                  <div className="inline-flex items-center gap-3 text-sm font-semibold text-neutral-500">
                    <FiLoader className="h-5 w-5 animate-spin text-[#00BC7D]" />
                    Loading users...
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center sm:px-6">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#00BC7D]/10 text-[#008E60]">
                      <FiUsers className="h-6 w-6" />
                    </div>

                    <h3 className="text-base font-bold text-neutral-950">
                      No users found
                    </h3>

                    <p className="mt-2 text-sm text-neutral-500">
                      Try changing the current filters or search text.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="transition hover:bg-[#00BC7D]/[0.035]"
                >
                  {/* USER */}
                  <td className="px-5 py-5 align-top sm:px-6">
                    <div className="flex min-w-[220px] items-center gap-4">
                      <div
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white",
                          user.role === "admin"
                            ? "bg-violet-600"
                            : user.role === "client"
                              ? "bg-blue-600"
                              : "bg-orange-500"
                        )}
                      >
                        {getInitials(user.name)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-neutral-950">
                          {user.name}
                        </p>

                        <p className="mt-1 truncate text-sm font-medium text-neutral-500">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* CONTACT */}
                  <td className="px-5 py-5 align-top">
                    <div className="min-w-[210px] space-y-2 text-sm text-neutral-600">
                      {user.email ? (
                        <div className="flex items-start gap-2">
                          <FiMail className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                          <span className="break-all">{user.email}</span>
                        </div>
                      ) : (
                        <span className="text-neutral-400">No email</span>
                      )}

                      {(user.role === "client" || user.role === "team") && (
                        <div className="flex items-start gap-2">
                          <FiPhone className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                          <span>{user.phone || "No phone"}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* ROLE */}
                  <td className="px-5 py-5 align-top">
                    <RoleBadge role={user.role} />
                  </td>

                  {/* STATUS */}
                  <td className="px-5 py-5 align-top">
                    <StatusBadge status={user.status} />
                  </td>

                  {/* DETAILS */}
                  <td className="px-5 py-5 align-top">
                    <div className="min-w-[250px] space-y-2 text-sm text-neutral-600">
                      {user.role === "admin" && (
                        <div className="flex items-start gap-2">
                          <FiShield className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                          <span>System administrator account</span>
                        </div>
                      )}

                      {user.role === "client" && (
                        <>
                          <div className="flex items-start gap-2">
                            <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                            <span>{user.hasilLocation || "No location"}</span>
                          </div>

                          <div className="flex items-start gap-2">
                            <FiGrid className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                            <span>
                              Total counters:{" "}
                              <strong className="font-semibold text-neutral-950">
                                {user.totalCounters ?? 0}
                              </strong>
                            </span>
                          </div>
                        </>
                      )}

                      {user.role === "team" && (
                        <>
                          <div className="flex items-start gap-2">
                            <FiUser className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                            <span>
                              Client:{" "}
                              <strong className="font-semibold text-neutral-950">
                                {user.client?.name || "Unassigned"}
                              </strong>
                            </span>
                          </div>

                          <div className="flex items-start gap-2">
                            <FiHash className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                            <span>
                              Counter:{" "}
                              <strong className="font-semibold text-neutral-950">
                                {user.counterNumber || "—"}
                              </strong>
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-5 py-5 text-right align-top sm:px-6">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onEdit(user)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#00BC7D]/20 bg-[#00BC7D]/10 text-[#008E60] transition hover:bg-[#00BC7D]/20"
                        title="Edit user"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onDelete(user)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                        title="Delete user"
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

export default function UserDirectorySection() {
  const [authLoading, setAuthLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [upsertOpen, setUpsertOpen] = useState(false);
  const [upsertMode, setUpsertMode] = useState("create");
  const [selectedUser, setSelectedUser] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);

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
      fetchUsers(1);
    }
  }, [debouncedSearch, roleFilter, statusFilter]);

  const visibleActive = users.filter(
    (user) => String(user.status).toLowerCase() === "active"
  ).length;

  const visibleClients = users.filter(
    (user) => String(user.role).toLowerCase() === "client"
  ).length;

  const visibleTeams = users.filter(
    (user) => String(user.role).toLowerCase() === "team"
  ).length;

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

      await Promise.all([fetchUsers(1), fetchClients()]);
    } catch (error) {
      setAccessDenied(true);
      toast.error(error?.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function fetchUsers(page = 1) {
    setLoadingUsers(true);

    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(pagination.limit));

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);

      const data = await requestJSON(`${USERS_API}?${params.toString()}`, {
        method: "GET",
      });

      setUsers(data.data.items || []);
      setPagination(data.data.pagination);
    } catch (error) {
      toast.error(error?.message || "Failed to fetch users.");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function fetchClients() {
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
    }
  }

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await Promise.all([fetchUsers(pagination.page), fetchClients()]);
      toast.success("User directory refreshed.");
    } finally {
      setRefreshing(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
  }

  function openCreateModal() {
    setUpsertMode("create");
    setSelectedUser(null);
    setUpsertOpen(true);
  }

  function openEditModal(user) {
    setUpsertMode("edit");
    setSelectedUser(user);
    setUpsertOpen(true);
  }

  function openDeleteModal(user) {
    setDeleteUserTarget(user);
    setDeleteOpen(true);
  }

  async function handleSaved() {
    await Promise.all([fetchUsers(pagination.page), fetchClients()]);
  }

  async function handleDeleted() {
    const nextPage =
      users.length === 1 && pagination.page > 1
        ? pagination.page - 1
        : pagination.page;

    await Promise.all([fetchUsers(nextPage), fetchClients()]);
  }

  function goPreviousPage() {
    if (!pagination.hasPrevPage) return;
    fetchUsers(pagination.page - 1);
  }

  function goNextPage() {
    if (!pagination.hasNextPage) return;
    fetchUsers(pagination.page + 1);
  }

  if (authLoading) {
    return (
      <>
        <Toaster position="top-right" />

        <CenterStateCard
          icon={<FiLoader className="h-6 w-6 animate-spin" />}
          title="Verifying Admin Access"
          description="Checking your authenticated session and dashboard permissions."
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
          description="This dashboard is available only to authenticated admin accounts."
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
              <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-[#00BC7D]/10 blur-3xl" />

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00BC7D]/20 bg-[#00BC7D]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#008E60]">
                    <FiShield className="h-3.5 w-3.5" />
                    Admin Control Center
                  </div>

                  <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
                    User Management
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base">
                    Create, update, filter, and manage admin, client, and team
                    accounts from one structured user directory.
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
                    Add New User
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* STATS */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Matched Users"
              value={pagination.total}
              subtitle="Total records after active filters"
              accent="bg-[#00BC7D] text-white shadow-[0_14px_30px_rgba(0,188,125,0.22)]"
              icon={<FiUsers className="h-6 w-6" />}
            />

            <StatCard
              title="Active Visible"
              value={visibleActive}
              subtitle="Active users on this page"
              accent="bg-[#00BC7D]/10 text-[#008E60]"
              icon={<FiUserCheck className="h-6 w-6" />}
            />

            <StatCard
              title="Clients Visible"
              value={visibleClients}
              subtitle="Client users on this page"
              accent="bg-blue-100 text-blue-700"
              icon={<FiUser className="h-6 w-6" />}
            />

            <StatCard
              title="Teams Visible"
              value={visibleTeams}
              subtitle="Team users on this page"
              accent="bg-orange-100 text-orange-700"
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
                  Search & Filter Users
                </h2>

                <p className="text-sm text-neutral-500">
                  Filter the table by keyword, role, or account status.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_0.7fr_0.7fr_auto]">
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
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className={input}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="client">Client</option>
                <option value="team">Team</option>
              </select>

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

          {/* USERS TABLE */}
          <UsersTable
            users={users}
            loadingUsers={loadingUsers}
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
                {users.length}
              </span>{" "}
              users on page{" "}
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

      {/* CREATE / EDIT MODAL */}
      <AnimatePresence>
        {upsertOpen && (
          <UserUpsertModal
            open={upsertOpen}
            onClose={() => setUpsertOpen(false)}
            mode={upsertMode}
            initial={selectedUser}
            clients={clients}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {deleteOpen && (
          <DeleteUserModal
            open={deleteOpen}
            onClose={() => {
              setDeleteOpen(false);
              setDeleteUserTarget(null);
            }}
            user={deleteUserTarget}
            onDeleted={handleDeleted}
          />
        )}
      </AnimatePresence>
    </>
  );
}