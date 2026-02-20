export function getAvatarUrl(name: string): string {
  const seed = encodeURIComponent(name || "Anonymous");
  return `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}
