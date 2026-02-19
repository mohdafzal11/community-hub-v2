import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { stripPasswordHash } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const topics = await storage.getRecentTopics(limit);
    return NextResponse.json(
      topics.map((t) => ({ ...t, author: stripPasswordHash(t.author) }))
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
