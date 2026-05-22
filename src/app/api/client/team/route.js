import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import User from "@/models/user.model";
import { requireAuth } from "@/lib/auth";

/* ==========================================================================
   HELPERS
   ========================================================================== */

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

function serializeUser(user) {
  if (!user) return null;

  return {
    id: user._id?.toString?.() || user.id,
    name: user.name || "",
    username: user.username || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "",
    status: user.status || "",
    isVerified: Boolean(user.isVerified),
    counterNumber: user.counterNumber || null,
    client: user.client || null,
    lastLoginAt: user.lastLoginAt || null,
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
}

function groupTeamByCounter(teamMembers = []) {
  const groupedMap = new Map();

  for (const member of teamMembers) {
    const counterKey = member.counterNumber || "no-counter";

    if (!groupedMap.has(counterKey)) {
      groupedMap.set(counterKey, {
        counterNumber: member.counterNumber || null,
        totalMembers: 0,
        activeMembers: 0,
        inactiveMembers: 0,
        suspendedMembers: 0,
        members: [],
      });
    }

    const group = groupedMap.get(counterKey);

    group.totalMembers += 1;

    if (member.status === "active") {
      group.activeMembers += 1;
    }

    if (member.status === "inactive") {
      group.inactiveMembers += 1;
    }

    if (member.status === "suspended") {
      group.suspendedMembers += 1;
    }

    group.members.push(serializeUser(member));
  }

  return Array.from(groupedMap.values()).sort((a, b) => {
    if (a.counterNumber === null) return 1;
    if (b.counterNumber === null) return -1;
    return a.counterNumber - b.counterNumber;
  });
}

/* ==========================================================================
   GET CLIENT TEAM MEMBERS
   Route: GET /api/client/team
   Access:
   - client: can see all team members under own client account
   - admin: can see team members by passing ?clientId=CLIENT_ID
   - team: not allowed
   ========================================================================== */

export async function GET(req) {
  try {
    await connectDB();

    const auth = await requireAuth(req);

    if (!auth?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const search = cleanString(searchParams.get("search"));
    const status = cleanLower(searchParams.get("status"));
    const counterNumber = toInteger(searchParams.get("counterNumber"), 0);
    const groupByCounter = searchParams.get("groupByCounter") !== "false";

    let clientId = auth.user.id;

    if (auth.user.role === "admin") {
      const requestedClientId = cleanString(searchParams.get("clientId"));

      if (!requestedClientId) {
        return NextResponse.json(
          {
            success: false,
            message: "Admin must provide clientId.",
          },
          { status: 400 }
        );
      }

      clientId = requestedClientId;
    }

    if (auth.user.role === "team") {
      return NextResponse.json(
        {
          success: false,
          message: "Team members cannot access the full team list.",
        },
        { status: 403 }
      );
    }

    if (!["client", "admin"].includes(auth.user.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only client and admin users can access team details.",
        },
        { status: 403 }
      );
    }

    const client = await User.findOne({
      _id: clientId,
      role: "client",
    })
      .select(
        "name username email phone address hasilLocation totalCounters status createdAt updatedAt"
      )
      .lean();

    if (!client) {
      return NextResponse.json(
        {
          success: false,
          message: "Client not found.",
        },
        { status: 404 }
      );
    }

    const query = {
      role: "team",
      client: clientId,
    };

    if (status && ["active", "inactive", "suspended"].includes(status)) {
      query.status = status;
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
      ];
    }

    const teamMembers = await User.find(query)
      .select(
        "name username email phone role status isVerified client counterNumber lastLoginAt createdAt updatedAt"
      )
      .sort({
        counterNumber: 1,
        createdAt: -1,
        _id: -1,
      })
      .lean();

    const totalMembers = teamMembers.length;
    const activeMembers = teamMembers.filter(
      (member) => member.status === "active"
    ).length;
    const inactiveMembers = teamMembers.filter(
      (member) => member.status === "inactive"
    ).length;
    const suspendedMembers = teamMembers.filter(
      (member) => member.status === "suspended"
    ).length;

    const counters = groupByCounter ? groupTeamByCounter(teamMembers) : [];

    return NextResponse.json(
      {
        success: true,
        message: "Client team members fetched successfully.",
        data: {
          client: {
            id: client._id?.toString?.() || client.id,
            name: client.name || "",
            username: client.username || "",
            email: client.email || "",
            phone: client.phone || "",
            address: client.address || "",
            hasilLocation: client.hasilLocation || "",
            totalCounters: client.totalCounters || 0,
            status: client.status || "",
            createdAt: client.createdAt || null,
            updatedAt: client.updatedAt || null,
          },

          summary: {
            totalMembers,
            activeMembers,
            inactiveMembers,
            suspendedMembers,
            totalCounters: client.totalCounters || 0,
          },

          counters,

          members: teamMembers.map(serializeUser),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch client team members.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}