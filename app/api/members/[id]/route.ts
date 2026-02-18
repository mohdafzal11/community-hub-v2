import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { storage } from "@/lib/storage";

const updateProfileSchema = z.object({
  username: z.string().min(1).max(100).optional(),
  bio: z.string().max(1000).optional(),
  skillTags: z.array(z.string()).optional(),
  lensHandle: z.string().optional(),
  farcasterHandle: z.string().optional(),
  xHandle: z.string().optional(),
  telegramHandle: z.string().optional(),
  college: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await storage.getUser(id);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session.userId || session.userId !== id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const user = await storage.updateUser(id, parsed.data);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    await storage.createActivity({
      type: "profile_update",
      userId: id,
      metadata: { updatedFields: Object.keys(parsed.data) },
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
