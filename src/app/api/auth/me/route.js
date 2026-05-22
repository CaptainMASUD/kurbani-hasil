import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(req) {
  try {
    const auth = await requireAuth(req);

    if (!auth.ok) {
      return auth.res;
    }

    return NextResponse.json(
      {
        success: true,
        message: "Authenticated user fetched successfully.",
        data: {
          user: auth.user,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify user.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}