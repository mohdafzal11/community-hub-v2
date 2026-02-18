import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    const quests = await storage.getAllQuests();
    return NextResponse.json(quests);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
