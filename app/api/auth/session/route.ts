import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    const session = await getSession();

    if (!session.userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await storage.getUser(session.userId);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
