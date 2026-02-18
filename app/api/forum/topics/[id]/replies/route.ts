import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const replies = await storage.getRepliesByTopic(id);
    return NextResponse.json(replies);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
