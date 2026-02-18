import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { storage } from "@/lib/storage";

const createTopicSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(1).max(500),
  content: z.string().min(1).max(10000),
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
    const parsed = createTopicSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const topic = await storage.createTopic({
      ...parsed.data,
      authorId: session.userId,
    });

    await storage.createActivity({
      type: "new_topic",
      userId: session.userId,
      metadata: { topicId: topic.id, topicTitle: topic.title },
    });

    return NextResponse.json(topic);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
