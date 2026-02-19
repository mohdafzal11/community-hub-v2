import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { requireRole, AuthError } from "@/lib/rbac";

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

export async function POST(request: NextRequest) {
  try {
    await requireRole(["admin"]);
    const body = await request.json();
    const { name, slug, description, icon } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const category = await storage.createCategory({
      name,
      slug,
      description: description || "",
      icon: icon || "MessageSquare",
    });

    return NextResponse.json(category, { status: 201 });
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
