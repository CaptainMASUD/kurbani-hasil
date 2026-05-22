import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import User from "@/models/user.model.js";

export async function POST(req) {
  try {
    await connectDB();

    const existingUserCount = await User.countDocuments();

    if (existingUserCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Registration is closed. Users must be created by an admin.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const name = body?.name?.trim?.() || "";
    const username = body?.username?.trim?.().toLowerCase?.() || "";
    const email = body?.email?.trim?.().toLowerCase?.() || "";
    const password = body?.password || "";

    if (!name || !username || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, username, email, and password are required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    const existingUsername = await User.findOne({ username }).lean();

    if (existingUsername) {
      return NextResponse.json(
        {
          success: false,
          message: "Username already exists.",
        },
        { status: 409 }
      );
    }

    const existingEmail = await User.findOne({ email }).lean();

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already exists.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name,
      username,
      email,
      passwordHash,
      role: "admin",
      status: "active",
      isVerified: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "First admin registered successfully.",
        data: admin,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Registration failed.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}