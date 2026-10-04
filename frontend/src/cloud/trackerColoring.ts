import type { ModuleCloudPoint } from "../api/cloud";
import type { TrackerFormat } from "../api/modules";
import type { PointColoring, SlotPaint } from "./pointColoring";

/** A tracker format as the module legend lists it: the format, and how many modules on the cloud are written in it. */
export interface TrackerCount {
    readonly format: TrackerFormat;
    readonly moduleCount: number;
}

/** The formats the module cloud holds, most modules first, ties by name. */
export function trackerCounts(points: readonly ModuleCloudPoint[]): readonly TrackerCount[] {
    const countByFormat = new Map<TrackerFormat, number>();
    for (const point of points) {
        countByFormat.set(point.tracker, (countByFormat.get(point.tracker) ?? 0) + 1);
    }
    return [...countByFormat]
        .map(([format, moduleCount]): TrackerCount => ({ format, moduleCount }))
        .sort((first, second) => second.moduleCount - first.moduleCount || first.format.localeCompare(second.format));
}

/**
 * The coloring the painted formats describe: each painted format takes a slot of its own in its
 * stamp's color, and every module written in it takes that slot, so a module's point wears the color
 * its badge does. A module of a format left unpainted joins the substrate.
 */
export function trackerColoring(points: readonly ModuleCloudPoint[], painted: readonly TrackerFormat[]): PointColoring {
    const slotByFormat = new Map(painted.map((format, index) => [format, index + 1]));
    const slotByHash = new Map<string, number>();
    for (const point of points) {
        const slot = slotByFormat.get(point.tracker);
        if (slot !== undefined) {
            slotByHash.set(point.module_hash, slot);
        }
    }
    return { slotByHash, paints: painted.map((format): SlotPaint => ({ kind: "tracker", format })) };
}
