import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    const session = await getSession();

    if (!session.userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const completions = await storage.getUserQuestCompletions(session.userId);
    return NextResponse.json(completions);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
