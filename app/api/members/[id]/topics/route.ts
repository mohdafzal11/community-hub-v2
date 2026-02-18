import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const topics = await storage.getTopicsByAuthor(id);
    return NextResponse.json(topics);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
