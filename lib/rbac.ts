import type { User } from "@/shared/schema";
import { getSession } from "./session";
import { storage } from "./storage";

export type Role = "admin" | "contributor" | "ambassador";

export function hasRole(user: User, role: Role): boolean {
  return user.role === role;
}

export function hasAnyRole(user: User, roles: Role[]): boolean {
  return roles.includes(user.role as Role);
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const session = await getSession();
  if (!session.userId) return null;
  const user = await storage.getUser(session.userId);
  return user ?? null;
}

export async function requireAuth(): Promise<User> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new AuthError("Not authenticated", 401);
  }
  return user;
}

export async function requireRole(roles: Role[]): Promise<User> {
  const user = await requireAuth();
  if (!hasAnyRole(user, roles)) {
    throw new AuthError("Forbidden: insufficient permissions", 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function stripPasswordHash(user: User): Omit<User, "passwordHash"> {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}
