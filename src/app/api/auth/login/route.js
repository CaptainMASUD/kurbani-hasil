import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import User from "@/models/user.model";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export async function POST(req) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json(
        {
          success: false,
          message: "JWT_SECRET is missing.",
        },
        { status: 500 }
      );
    }

    await connectDB();

    const body = await req.json();

    const identifier =
      body?.identifier?.trim?.().toLowerCase?.() ||
      body?.email?.trim?.().toLowerCase?.() ||
      body?.username?.trim?.().toLowerCase?.() ||
      "";

    const password = body?.password || "";

    if (!identifier || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email/username and password are required.",
        },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    })
      .select(
        "+passwordHash name username email role status isVerified phone address hasilLocation totalCounters client counterNumber"
      )
      .populate({
        path: "client",
        select: "name username email phone hasilLocation totalCounters",
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials.",
        },
        { status: 401 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "User is inactive or suspended.",
        },
        { status: 403 }
      );
    }

    const matched = await bcrypt.compare(password, user.passwordHash);

    if (!matched) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials.",
        },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        sub: String(user._id),
        username: user.username,
        email: user.email || null,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    user.lastLoginAt = new Date();
    await user.save();

    const res = NextResponse.json(
      {
        success: true,
        message: "Login successful.",
        data: {
          token,
          user: {
            id: String(user._id),
            name: user.name,
            username: user.username,
            email: user.email || null,
            role: user.role,
            status: user.status,
            isVerified: !!user.isVerified,

            phone: user.phone || "",
            address: user.address || "",
            hasilLocation: user.hasilLocation || "",
            totalCounters: user.totalCounters || 0,
            counterNumber: user.counterNumber || null,

            client: user.client
              ? {
                  id: String(user.client._id),
                  name: user.client.name,
                  username: user.client.username,
                  email: user.client.email,
                  phone: user.client.phone,
                  hasilLocation: user.client.hasilLocation,
                  totalCounters: user.client.totalCounters,
                }
              : null,
          },
        },
      },
      { status: 200 }
    );

    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Login failed.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}