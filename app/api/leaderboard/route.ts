import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "totalPoints";

    const leaderboard = await storage.getLeaderboard(sortBy);
    return NextResponse.json(leaderboard);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
