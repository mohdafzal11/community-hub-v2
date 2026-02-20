import { createAvatar } from "@dicebear/core";
import { notionistsNeutral } from "@dicebear/collection";

const cache = new Map<string, string>();

export function getAvatarUrl(name: string): string {
  const key = name || "Anonymous";
  if (cache.has(key)) return cache.get(key)!;
  const avatar = createAvatar(notionistsNeutral, { seed: key });
  const uri = avatar.toDataUri();
  cache.set(key, uri);
  return uri;
}
