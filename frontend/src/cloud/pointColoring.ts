import type { TrackerFormat } from "../api/modules";

/** The palette slot every point takes that no painted entry reaches: the ground the painted ones sit on. */
export const SUBSTRATE_SLOT = 0;

/**
 * What one palette slot paints in: a tag's color from its lasting rank, or a tracker format's
 * stamp color, so the sample and the module clouds share one palette and one way of drawing it.
 */
export type SlotPaint =
    { readonly kind: "label"; readonly rank: number } | { readonly kind: "tracker"; readonly format: TrackerFormat };

/** How the cloud's points are colored: the painted entries, each in its own slot's paint. */
export interface PointColoring {
    /** The palette slot of every point a painted entry reaches, by the hash its point names. */
    readonly slotByHash: ReadonlyMap<string, number>;
    /** The paint of each painted entry, in slot order; slot `i + 1` paints in `paints[i]`. */
    readonly paints: readonly SlotPaint[];
}

/** The coloring while a cloud's colors are on their way: every point on the ground, awaiting its color. */
export const SUBSTRATE_ONLY_COLORING: PointColoring = { slotByHash: new Map(), paints: [] };
