/**
 * Tasteful, warm palette for match groups. Cycles through amber, sage,
 * copper and muted rose — no indigo/blue, consistent with the espresso
 * theme. Used by the timeline and match list to link corresponding
 * regions across Video A / Video B.
 */

export const MATCH_PALETTE: { base: string; soft: string }[] = [
  { base: "oklch(0.55 0.16 55)", soft: "oklch(0.55 0.16 55 / 0.18)" }, // amber
  { base: "oklch(0.5 0.11 150)", soft: "oklch(0.5 0.11 150 / 0.18)" }, // sage
  { base: "oklch(0.55 0.15 45)", soft: "oklch(0.55 0.15 45 / 0.18)" }, // copper
  { base: "oklch(0.5 0.13 25)", soft: "oklch(0.5 0.13 25 / 0.18)" }, // rose
  { base: "oklch(0.52 0.12 95)", soft: "oklch(0.52 0.12 95 / 0.18)" }, // gold
  { base: "oklch(0.48 0.1 165)", soft: "oklch(0.48 0.1 165 / 0.18)" }, // teal-sage
];

/** A stable group index derived from a match id / group bucket. */
export function groupColorIndex(group: number): number {
  return ((group % MATCH_PALETTE.length) + MATCH_PALETTE.length) %
    MATCH_PALETTE.length;
}

export function groupColor(group: number) {
  return MATCH_PALETTE[groupColorIndex(group)];
}
