import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { stripPasswordHash } from "@/lib/rbac";

export async function GET() {
  try {
    const members = await storage.getAllMembers();
    return NextResponse.json(members.map(stripPasswordHash));
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
