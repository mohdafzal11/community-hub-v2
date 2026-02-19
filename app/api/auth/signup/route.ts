import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";
import { storage } from "@/lib/storage";
import { stripPasswordHash } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, username } = body;

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: "Email, password, and username are required" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    const existingUser = await storage.getUserByEmail(email.toLowerCase());
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const referralCode = `REF_${Date.now().toString(36).toUpperCase()}`;

    const user = await storage.createUser({
      email: email.toLowerCase(),
      passwordHash,
      username,
      referralCode,
      role: "contributor",
    });

    const session = await getSession();
    session.userId = user.id;
    await session.save();

    await storage.createActivity({
      type: "new_contributor",
      userId: user.id,
      metadata: { username },
    });

    return NextResponse.json({ user: stripPasswordHash(user) });
  } catch (error: any) {
    console.error("Signup error:", error);
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Username or email already taken" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
