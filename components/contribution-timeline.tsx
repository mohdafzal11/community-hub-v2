"use client";

interface TimelineProps {
  weeks: number[];
  variant?: "full" | "mini";
}

function getOpacity(count: number): string {
  if (count === 0) return "bg-foreground/[0.05]";
  if (count <= 2) return "bg-foreground/10";
  if (count <= 5) return "bg-foreground/30";
  return "bg-foreground/60";
}

export function ContributionTimeline({ weeks, variant = "full" }: TimelineProps) {
  const displayWeeks = variant === "mini" ? weeks.slice(-8) : weeks;
  const blockSize = variant === "mini" ? "w-[6px] h-[6px]" : "w-3 h-3";
  const gap = variant === "mini" ? "gap-[2px]" : "gap-1";

  return (
    <div className={`flex items-center ${gap}`} data-testid="contribution-timeline">
      {displayWeeks.map((count, i) => (
        <div
          key={i}
          className={`${blockSize} rounded-[2px] ${getOpacity(count)}`}
          title={`Week ${i + 1}: ${count} contributions`}
        />
      ))}
    </div>
  );
}

export function generateMockWeeklyData(totalPoints: number, eventsCount: number): number[] {
  const weeks: number[] = [];
  const baseActivity = Math.floor(totalPoints / 500);
  for (let i = 0; i < 12; i++) {
    const variance = Math.floor(Math.random() * 4);
    const weekActivity = Math.max(0, baseActivity + variance - 1 + Math.floor(eventsCount / 4));
    weeks.push(weekActivity);
  }
  return weeks;
}
