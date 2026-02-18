import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    const activities = await storage.getActivities(50);
    return NextResponse.json(activities);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
