// api/admin/users/route.js
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

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

/**
 * GET ALL USERS
 * Supports:
 * - search
 * - role
 * - status
 * - clientId
 * - counterNumber
 */
export async function GET(req) {
  try {
    await connectDB();

    const auth = await requireAuth(req);
    const adminCheck = requireAdmin(auth);

    if (!adminCheck.ok) {
      return adminCheck.res;
    }

    const { searchParams } = new URL(req.url);

    const page = Math.max(1, toInteger(searchParams.get("page"), 1));
    const limit = Math.min(
      100,
      Math.max(1, toInteger(searchParams.get("limit"), 10))
    );
    const skip = (page - 1) * limit;

    const search = cleanString(searchParams.get("search"));
    const role = cleanString(searchParams.get("role"));
    const status = cleanString(searchParams.get("status"));
    const clientId = cleanString(searchParams.get("clientId"));
    const counterNumber = toInteger(searchParams.get("counterNumber"), 0);

    const query = {};

    if (role && USER_ROLES.includes(role)) {
      query.role = role;
    }

    if (status && USER_STATUSES.includes(status)) {
      query.status = status;
    }

    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      query.client = clientId;
    }

    if (counterNumber > 0) {
      query.counterNumber = counterNumber;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { hasilLocation: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      User.find(query)
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
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Users fetched successfully.",
        data: {
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch users.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * CREATE USER
 * Supports:
 * - admin
 * - client
 * - team
 *
 * Team:
 * - must belong to a client
 * - must be assigned to a valid counter
 * - multiple team members can use the same counter
 */
export async function POST(req) {
  try {
    await connectDB();

    const auth = await requireAuth(req);
    const adminCheck = requireAdmin(auth);

    if (!adminCheck.ok) {
      return adminCheck.res;
    }

    const body = await req.json();

    const name = cleanString(body?.name);
    const username = cleanLower(body?.username);
    const email = cleanLower(body?.email);
    const password = cleanString(body?.password);

    const role = cleanString(body?.role);
    const status = cleanString(body?.status) || "active";

    const phone = cleanString(body?.phone);
    const address = cleanString(body?.address);
    const hasilLocation = cleanString(body?.hasilLocation);

    const totalCounters = toInteger(body?.totalCounters, 0);

    const clientId = cleanString(body?.clientId);
    const counterNumber = toInteger(body?.counterNumber, 0);

    /**
     * Basic required fields
     */
    if (!name || !username || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, username, password, and role are required.",
        },
        { status: 400 }
      );
    }

    /**
     * Validate username length early
     */
    if (username.length < 3) {
      return NextResponse.json(
        {
          success: false,
          message: "Username must be at least 3 characters.",
        },
        { status: 400 }
      );
    }

    /**
     * Validate role/status
     */
    if (!USER_ROLES.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid role.",
        },
        { status: 400 }
      );
    }

    if (!USER_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid status.",
        },
        { status: 400 }
      );
    }

    /**
     * Password validation
     */
    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    /**
     * Admin and client must have email
     */
    if ((role === "admin" || role === "client") && !email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required for admin and client.",
        },
        { status: 400 }
      );
    }

    /**
     * Client validation
     */
    if (role === "client") {
      if (!phone || !address || !hasilLocation) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Client phone, address, and hasil location are required.",
          },
          { status: 400 }
        );
      }

      if (totalCounters < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Total counters must be 0 or greater.",
          },
          { status: 400 }
        );
      }
    }

    /**
     * Team validation
     */
    let client = null;

    if (role === "team") {
      if (!clientId || !mongoose.Types.ObjectId.isValid(clientId)) {
        return NextResponse.json(
          {
            success: false,
            message: "Valid clientId is required for team.",
          },
          { status: 400 }
        );
      }

      client = await User.findOne({
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

      if (!client.totalCounters || client.totalCounters < 1) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This client has no counters configured. Add counters first.",
          },
          { status: 400 }
        );
      }

      if (!counterNumber || counterNumber < 1) {
        return NextResponse.json(
          {
            success: false,
            message: "Valid counter number is required.",
          },
          { status: 400 }
        );
      }

      if (counterNumber > client.totalCounters) {
        return NextResponse.json(
          {
            success: false,
            message: `Counter number cannot exceed client's total counters (${client.totalCounters}).`,
          },
          { status: 400 }
        );
      }

      /**
       * IMPORTANT:
       * We DO NOT check whether another team member already has this counter.
       * That means:
       * - Counter 1 can have multiple team members
       * - Counter 2 can have multiple team members
       * exactly as requested.
       */
    }

    /**
     * Prevent duplicate username
     */
    const duplicateUsername = await User.findOne({ username }).lean();

    if (duplicateUsername) {
      return NextResponse.json(
        {
          success: false,
          message: "Username already exists.",
        },
        { status: 409 }
      );
    }

    /**
     * Prevent duplicate email only when email exists
     */
    if (email) {
      const duplicateEmail = await User.findOne({ email }).lean();

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

    /**
     * Create password hash
     */
    const passwordHash = await bcrypt.hash(password, 12);

    /**
     * Create user
     */
    const user = await User.create({
      name,
      username,
      email: email || undefined,
      passwordHash,

      role,
      status,
      isVerified: true,

      phone: role === "client" || role === "team" ? phone : "",

      address: role === "client" ? address : "",

      hasilLocation: role === "client" ? hasilLocation : "",

      totalCounters: role === "client" ? totalCounters : 0,

      client: role === "team" ? clientId : null,

      counterNumber: role === "team" ? counterNumber : null,

      createdBy: auth.user.id,
    });

    const createdUser = await User.findById(user._id)
      .select("-passwordHash")
      .populate({
        path: "client",
        select: "name username email phone hasilLocation totalCounters",
      })
      .lean();

    return NextResponse.json(
      {
        success: true,
        message:
          role === "team"
            ? `Team member assigned to Counter ${counterNumber} successfully.`
            : "User created successfully.",
        data: createdUser,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create user.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}