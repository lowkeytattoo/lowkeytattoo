const PALETTE = [
  "bg-blue-500/25 text-blue-300 border-blue-500/30",
  "bg-violet-500/25 text-violet-300 border-violet-500/30",
  "bg-emerald-500/25 text-emerald-300 border-emerald-500/30",
  "bg-amber-500/25 text-amber-300 border-amber-500/30",
  "bg-rose-500/25 text-rose-300 border-rose-500/30",
  "bg-cyan-500/25 text-cyan-300 border-cyan-500/30",
];

function nameHash(name: string) {
  return name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface ArtistAvatarProps {
  name?: string | null;
  /** xs = 20px, sm = 24px (default) */
  size?: "xs" | "sm";
}

export function ArtistAvatar({ name, size = "sm" }: ArtistAvatarProps) {
  if (!name) return <span className="text-muted-foreground text-xs">—</span>;

  const color = PALETTE[nameHash(name) % PALETTE.length];
  const initials = getInitials(name);
  const dim = size === "xs" ? "w-5 h-5 text-[9px]" : "w-6 h-6 text-[10px]";

  return (
    <span
      title={name}
      className={`inline-flex items-center justify-center rounded-full border font-['IBM_Plex_Mono'] font-bold shrink-0 ${dim} ${color}`}
    >
      {initials}
    </span>
  );
}
