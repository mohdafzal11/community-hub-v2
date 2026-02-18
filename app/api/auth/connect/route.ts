import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { storage } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    let user = await storage.getUserByWallet(walletAddress);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const username = `user_${walletAddress.slice(2, 8).toLowerCase()}`;
      const referralCode = `REF_${walletAddress.slice(2, 10).toUpperCase()}`;
      user = await storage.createUser({
        walletAddress,
        username,
        referralCode,
      });
    }

    const session = await getSession();
    session.userId = user.id;
    await session.save();

    if (isNewUser) {
      await storage.createActivity({
        type: "new_contributor",
        userId: user.id,
        metadata: { walletAddress },
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
