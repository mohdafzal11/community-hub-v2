import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { requireRole, AuthError } from "@/lib/rbac";

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

export async function POST(request: NextRequest) {
  try {
    await requireRole(["admin"]);
    const body = await request.json();
    const { title, category, description, points, targetCount, difficulty } = body;

    if (!title || !category) {
      return NextResponse.json(
        { error: "Title and category are required" },
        { status: 400 }
      );
    }

    const quest = await storage.createQuest({
      title,
      category,
      description: description || "",
      points: points || 0,
      targetCount: targetCount || 1,
      difficulty: difficulty || "easy",
    });

    return NextResponse.json(quest, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
