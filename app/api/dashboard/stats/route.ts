import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    const stats = await storage.getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
