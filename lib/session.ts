import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: string;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long_for_iron_session",
  cookieName: "community-hub-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60,
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
