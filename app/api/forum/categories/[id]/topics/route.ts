import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { stripPasswordHash } from "@/lib/rbac";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const topics = await storage.getTopicsByCategory(id);
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
