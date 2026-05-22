// api/admin/users/[id]/route.js
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import User, {
  USER_ROLES,
  USER_STATUSES,
} from "@/models/user.model";
import { requireAuth, requireAdmin } from "@/lib/auth";

function cleanString(value = "") {
  return String(value || "").trim();
}

function cleanLower(value = "") {
  return cleanString(value).toLowerCase();
}

function toInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

/**
 * GET SINGLE USER
 */
export async function GET(req, { params }) {
  try {
    await connectDB();

    const auth = await requireAuth(req);
    const adminCheck = requireAdmin(auth);

    if (!adminCheck.ok) {
      return adminCheck.res;
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID.",
        },
        { status: 400 }
      );
    }

    const user = await User.findById(id)
      .select("-passwordHash")
      .populate({
        path: "client",
        select: "name username email phone hasilLocation totalCounters",
      })
      .populate({
        path: "createdBy",
        select: "name username email role",
      })
      .populate({
        path: "updatedBy",
        select: "name username email role",
      })
      .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "User fetched successfully.",
        data: user,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch user.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * UPDATE USER
 */
export async function PATCH(req, { params }) {
  try {
    await connectDB();

    const auth = await requireAuth(req);
    const adminCheck = requireAdmin(auth);

    if (!adminCheck.ok) {
      return adminCheck.res;
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID.",
        },
        { status: 400 }
      );
    }

    const user = await User.findById(id).select("+passwordHash");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    const body = await req.json();

    /**
     * Update name
     */
    if (body?.name !== undefined) {
      const name = cleanString(body.name);

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            message: "Name cannot be empty.",
          },
          { status: 400 }
        );
      }

      user.name = name;
    }

    /**
     * Update username
     */
    if (body?.username !== undefined) {
      const username = cleanLower(body.username);

      if (!username) {
        return NextResponse.json(
          {
            success: false,
            message: "Username cannot be empty.",
          },
          { status: 400 }
        );
      }

      if (username.length < 3) {
        return NextResponse.json(
          {
            success: false,
            message: "Username must be at least 3 characters.",
          },
          { status: 400 }
        );
      }

      const duplicateUsername = await User.findOne({
        username,
        _id: { $ne: user._id },
      }).lean();

      if (duplicateUsername) {
        return NextResponse.json(
          {
            success: false,
            message: "Username already exists.",
          },
          { status: 409 }
        );
      }

      user.username = username;
    }

    /**
     * Update email
     */
    if (body?.email !== undefined) {
      const email = cleanLower(body.email);

      if ((user.role === "admin" || user.role === "client") && !email) {
        return NextResponse.json(
          {
            success: false,
            message: "Email is required for admin and client.",
          },
          { status: 400 }
        );
      }

      if (email) {
        const duplicateEmail = await User.findOne({
          email,
          _id: { $ne: user._id },
        }).lean();

        if (duplicateEmail) {
          return NextResponse.json(
            {
              success: false,
              message: "Email already exists.",
            },
            { status: 409 }
          );
        }
      }

      user.email = email || undefined;
    }

    /**
     * Update password
     */
    if (body?.password !== undefined) {
      const password = cleanString(body.password);

      if (password.length < 6) {
        return NextResponse.json(
          {
            success: false,
            message: "Password must be at least 6 characters.",
          },
          { status: 400 }
        );
      }

      user.passwordHash = await bcrypt.hash(password, 12);
    }

    /**
     * Update status
     */
    if (body?.status !== undefined) {
      const status = cleanString(body.status);

      if (!USER_STATUSES.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid status.",
          },
          { status: 400 }
        );
      }

      user.status = status;
    }

    /**
     * Update role
     */
    if (body?.role !== undefined) {
      const role = cleanString(body.role);

      if (!USER_ROLES.includes(role)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid role.",
          },
          { status: 400 }
        );
      }

      user.role = role;
    }

    const finalRole = user.role;

    /**
     * ADMIN UPDATE VALIDATION
     */
    if (finalRole === "admin") {
      if (!user.email) {
        return NextResponse.json(
          {
            success: false,
            message: "Admin email is required.",
          },
          { status: 400 }
        );
      }

      user.phone = "";
      user.address = "";
      user.hasilLocation = "";
      user.totalCounters = 0;
      user.client = null;
      user.counterNumber = null;
    }

    /**
     * CLIENT UPDATE VALIDATION
     */
    if (finalRole === "client") {
      if (body?.phone !== undefined) {
        user.phone = cleanString(body.phone);
      }

      if (body?.address !== undefined) {
        user.address = cleanString(body.address);
      }

      if (body?.hasilLocation !== undefined) {
        user.hasilLocation = cleanString(body.hasilLocation);
      }

      if (body?.totalCounters !== undefined) {
        const totalCounters = toInteger(body.totalCounters, -1);

        if (totalCounters < 0) {
          return NextResponse.json(
            {
              success: false,
              message: "Total counters must be a whole number 0 or greater.",
            },
            { status: 400 }
          );
        }

        /**
         * Important:
         * Prevent reducing totalCounters below a counter already used
         * by an existing team member.
         *
         * Example:
         * - Client currently has 5 counters
         * - A team member is assigned to Counter 4
         * - Admin cannot reduce totalCounters to 3
         */
        const highestAssignedCounterTeam = await User.findOne({
          client: user._id,
          role: "team",
        })
          .sort({ counterNumber: -1 })
          .select("counterNumber")
          .lean();

        const highestAssignedCounter =
          highestAssignedCounterTeam?.counterNumber || 0;

        if (totalCounters < highestAssignedCounter) {
          return NextResponse.json(
            {
              success: false,
              message: `Cannot reduce total counters to ${totalCounters}. Counter ${highestAssignedCounter} already has team member assignments.`,
            },
            { status: 409 }
          );
        }

        user.totalCounters = totalCounters;
      }

      if (!user.email || !user.phone || !user.address || !user.hasilLocation) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Client email, phone, address, and hasil location are required.",
          },
          { status: 400 }
        );
      }

      user.client = null;
      user.counterNumber = null;
    }

    /**
     * TEAM UPDATE VALIDATION
     */
    if (finalRole === "team") {
      if (body?.phone !== undefined) {
        user.phone = cleanString(body.phone);
      }

      /**
       * Update assigned client
       */
      if (body?.clientId !== undefined) {
        const clientId = cleanString(body.clientId);

        if (!clientId || !mongoose.Types.ObjectId.isValid(clientId)) {
          return NextResponse.json(
            {
              success: false,
              message: "Valid clientId is required.",
            },
            { status: 400 }
          );
        }

        const client = await User.findOne({
          _id: clientId,
          role: "client",
        }).lean();

        if (!client) {
          return NextResponse.json(
            {
              success: false,
              message: "Client not found.",
            },
            { status: 404 }
          );
        }

        user.client = clientId;
      }

      /**
       * Update counter number
       */
      if (body?.counterNumber !== undefined) {
        const counterNumber = toInteger(body.counterNumber, 0);

        if (!counterNumber || counterNumber < 1) {
          return NextResponse.json(
            {
              success: false,
              message: "Valid counter number is required.",
            },
            { status: 400 }
          );
        }

        user.counterNumber = counterNumber;
      }

      /**
       * Final team field validation
       */
      if (!user.client || !user.counterNumber) {
        return NextResponse.json(
          {
            success: false,
            message: "Team member needs client and counter number.",
          },
          { status: 400 }
        );
      }

      /**
       * Confirm assigned client still exists
       */
      const assignedClient = await User.findOne({
        _id: user.client,
        role: "client",
      }).lean();

      if (!assignedClient) {
        return NextResponse.json(
          {
            success: false,
            message: "Assigned client not found.",
          },
          { status: 404 }
        );
      }

      /**
       * Client must have at least one configured counter
       */
      if (!assignedClient.totalCounters || assignedClient.totalCounters < 1) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Assigned client has no counters configured. Add counters first.",
          },
          { status: 400 }
        );
      }

      /**
       * Counter must exist under that client
       */
      if (user.counterNumber > assignedClient.totalCounters) {
        return NextResponse.json(
          {
            success: false,
            message: `Counter number cannot exceed client's total counters (${assignedClient.totalCounters}).`,
          },
          { status: 400 }
        );
      }

      /**
       * IMPORTANT:
       * No duplicate restriction here.
       * Multiple team members are allowed under the same counter.
       */
      user.address = "";
      user.hasilLocation = "";
      user.totalCounters = 0;
    }

    user.updatedBy = auth.user.id;

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-passwordHash")
      .populate({
        path: "client",
        select: "name username email phone hasilLocation totalCounters",
      })
      .populate({
        path: "createdBy",
        select: "name username email role",
      })
      .populate({
        path: "updatedBy",
        select: "name username email role",
      })
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "User updated successfully.",
        data: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update user.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE USER
 */
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const auth = await requireAuth(req);
    const adminCheck = requireAdmin(auth);

    if (!adminCheck.ok) {
      return adminCheck.res;
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID.",
        },
        { status: 400 }
      );
    }

    if (id === auth.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot delete your own account.",
        },
        { status: 400 }
      );
    }

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    /**
     * Prevent deleting a client while team members still belong to it
     */
    if (user.role === "client") {
      const teamCount = await User.countDocuments({
        client: user._id,
        role: "team",
      });

      if (teamCount > 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Cannot delete client. Delete or reassign team members first.",
          },
          { status: 409 }
        );
      }
    }

    await User.deleteOne({ _id: user._id });

    return NextResponse.json(
      {
        success: true,
        message: "User deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete user.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}