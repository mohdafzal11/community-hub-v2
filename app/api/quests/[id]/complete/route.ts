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

    const completion = await storage.getQuestCompletion(id, session.userId);
    if (!completion) {
      return NextResponse.json(
        { error: "Quest not started" },
        { status: 404 }
      );
    }

    if (completion.status === "completed") {
      return NextResponse.json(
        { error: "Quest already completed" },
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

    const updatedCompletion = await storage.updateQuestProgress(
      completion.id,
      100,
      "completed"
    );

    // Update user points and questsCompleted
    const user = await storage.getUser(session.userId);
    if (user) {
      await storage.updateUser(session.userId, {
        totalPoints: user.totalPoints + quest.points,
        questsCompleted: user.questsCompleted + 1,
      });
    }

    await storage.createActivity({
      type: "quest_completed",
      userId: session.userId,
      metadata: { questId: id, questTitle: quest.title, points: quest.points },
    });

    return NextResponse.json(updatedCompletion);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
