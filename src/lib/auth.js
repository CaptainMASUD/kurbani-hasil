import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import User from "@/models/user.model";

const JWT_SECRET = process.env.JWT_SECRET;

function getTokenFromRequest(req) {
  const auth = req.headers.get("authorization") || "";

  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }

  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);

  if (match?.[1]) {
    return decodeURIComponent(match[1]);
  }

  return null;
}

export async function requireAuth(req) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return {
        ok: false,
        res: NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        ),
      };
    }

    if (!JWT_SECRET) {
      return {
        ok: false,
        res: NextResponse.json(
          {
            success: false,
            error: "Server misconfigured: JWT_SECRET missing",
          },
          { status: 500 }
        ),
      };
    }

    let payload;

    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return {
        ok: false,
        res: NextResponse.json(
          { success: false, error: "Invalid token" },
          { status: 401 }
        ),
      };
    }

    await connectDB();

    const user = await User.findById(payload.sub)
      .select(
        "name username email role status phone address hasilLocation totalCounters client counterNumber"
      )
      .lean();

    if (!user) {
      return {
        ok: false,
        res: NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        ),
      };
    }

    if (user.status !== "active") {
      return {
        ok: false,
        res: NextResponse.json(
          { success: false, error: "User is inactive" },
          { status: 403 }
        ),
      };
    }

    return {
      ok: true,
      user: {
        id: String(user._id),
        name: user.name || "",
        username: user.username || "",
        email: user.email || null,
        role: user.role,
        status: user.status,

        phone: user.phone || "",
        address: user.address || "",
        hasilLocation: user.hasilLocation || "",
        totalCounters: user.totalCounters || 0,

        clientId: user.client ? String(user.client) : null,
        counterNumber: user.counterNumber || null,
      },
    };
  } catch (err) {
    return {
      ok: false,
      res: NextResponse.json(
        {
          success: false,
          error: "Auth check failed",
          details: err?.message || String(err),
        },
        { status: 500 }
      ),
    };
  }
}

export function requireAdmin(authResult) {
  if (!authResult?.ok) return authResult;

  if (authResult.user.role !== "admin") {
    return {
      ok: false,
      res: NextResponse.json(
        { success: false, error: "Forbidden: Admin only" },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

export function requireClient(authResult) {
  if (!authResult?.ok) return authResult;

  if (authResult.user.role !== "client") {
    return {
      ok: false,
      res: NextResponse.json(
        { success: false, error: "Forbidden: Client only" },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

export function requireTeam(authResult) {
  if (!authResult?.ok) return authResult;

  if (authResult.user.role !== "team") {
    return {
      ok: false,
      res: NextResponse.json(
        { success: false, error: "Forbidden: Team only" },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

export function requireAnyRole(authResult, roles = []) {
  if (!authResult?.ok) return authResult;

  if (!roles.includes(authResult.user.role)) {
    return {
      ok: false,
      res: NextResponse.json(
        { success: false, error: "Forbidden: Role not allowed" },
        { status: 403 }
      ),
    };
  }

  return authResult;
}