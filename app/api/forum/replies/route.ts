import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { storage } from "@/lib/storage";

const createReplySchema = z.object({
  topicId: z.string().uuid(),
  content: z.string().min(1).max(10000),
  parentReplyId: z.string().uuid().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createReplySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const reply = await storage.createReply({
      ...parsed.data,
      authorId: session.userId,
    });

    // Get the topic to include its title in the activity metadata
    const topic = await storage.getTopic(parsed.data.topicId);

    await storage.createActivity({
      type: "new_reply",
      userId: session.userId,
      metadata: {
        replyId: reply.id,
        topicId: parsed.data.topicId,
        topicTitle: topic?.title || "",
      },
    });

    return NextResponse.json(reply);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
