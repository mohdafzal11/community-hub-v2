import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    const categories = await storage.getAllCategories();
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
