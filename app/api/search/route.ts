import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    if (q.length < 2) {
      return NextResponse.json({ members: [], topics: [] });
    }

    const [members, topics] = await Promise.all([
      storage.searchMembers(q),
      storage.searchTopics(q),
    ]);

    return NextResponse.json({ members, topics });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
