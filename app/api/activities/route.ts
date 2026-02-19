import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { stripPasswordHash } from "@/lib/rbac";

export async function GET() {
  try {
    const activities = await storage.getActivities(50);
    return NextResponse.json(
      activities.map((a) => ({ ...a, user: stripPasswordHash(a.user) }))
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
