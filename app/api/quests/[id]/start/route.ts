import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { storage } from "@/lib/storage";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session.userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const existing = await storage.getQuestCompletion(id, session.userId);
    if (existing) {
      return NextResponse.json(
        { error: "Quest already started" },
        { status: 400 }
      );
    }

    const quest = await storage.getQuest(id);
    if (!quest) {
      return NextResponse.json(
        { error: "Quest not found" },
        { status: 404 }
      );
    }

    const completion = await storage.startQuest({
      questId: id,
      userId: session.userId,
      status: "in_progress",
      progress: 0,
    });

    return NextResponse.json(completion);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
