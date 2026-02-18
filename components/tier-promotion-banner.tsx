"use client";

import { useState, useEffect } from "react";

interface TierPromotionBannerProps {
  tier: string;
  onDismiss?: () => void;
}

export function TierPromotionBanner({ tier, onDismiss }: TierPromotionBannerProps) {
  const [phase, setPhase] = useState<"in" | "visible" | "out" | "gone">("in");

  useEffect(() => {
    const fadeInTimer = setTimeout(() => setPhase("visible"), 400);
    const stayTimer = setTimeout(() => setPhase("out"), 5400);
    const removeTimer = setTimeout(() => {
      setPhase("gone");
      onDismiss?.();
    }, 6000);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(stayTimer);
      clearTimeout(removeTimer);
    };
  }, [onDismiss]);

  if (phase === "gone") return null;

  const tierLabel = tier === "regional_lead" ? "Regional Lead"
    : tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <div
      className="w-full py-4 px-6 text-center"
      style={{
        backgroundColor: "#111110",
        color: "#FAFAF8",
        animation: phase === "in" ? "fade-in-banner 400ms var(--ease-slow) both"
          : phase === "out" ? "fade-out-banner 600ms ease-out both"
          : undefined,
      }}
      data-testid="banner-tier-promotion"
    >
      <h2 className="font-display font-semibold text-lg tracking-tight">
        You&apos;ve reached {tierLabel}
      </h2>
    </div>
  );
}
