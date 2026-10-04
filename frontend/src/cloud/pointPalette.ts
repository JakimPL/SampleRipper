import { labelColor } from "../theme/labelPalette";
import type { CloudColors } from "./cloudRenderSettings";
import type { CloudEntityPoint } from "./geometry";
import { type PointColoring, type SlotPaint, SUBSTRATE_SLOT } from "./pointColoring";

/** Which palette slot each point of a batch paints in. */
export interface PointSlots {
    /** Each point's slot, at the point's own index. */
    readonly slots: Uint16Array;
    /** The slot of the points that name nothing: those no painted entry reaches. */
    readonly substrateSlot: number;
    readonly slotCount: number;
}

/**
 * Each point's palette slot: the slot its painted entry holds -- a sample's first painted tag, a
 * module's painted format -- and the substrate's slot where no painted entry reaches it.
 */
export function slotPoints(points: readonly CloudEntityPoint[], coloring: PointColoring): PointSlots {
    const slots = new Uint16Array(points.length);
    points.forEach((point, index) => {
        slots[index] = coloring.slotByHash.get(point.ref.hash) ?? SUBSTRATE_SLOT;
    });
    return { slots, substrateSlot: SUBSTRATE_SLOT, slotCount: coloring.paints.length + 1 };
}

/** The color one slot paints in under the current theme. */
function paintColor(paint: SlotPaint, colors: CloudColors): string {
    switch (paint.kind) {
        case "label":
            return labelColor(paint.rank, colors.labels);
        case "tracker":
            return colors.trackers[paint.format];
    }
}

/** One color per slot `slotPoints` hands out under `coloring`, the substrate's in the recessive tone. */
export function paletteColors(coloring: PointColoring, colors: CloudColors): readonly string[] {
    return [colors.uncategorized, ...coloring.paints.map((paint) => paintColor(paint, colors))];
}

/** One value per slot, such as an opacity or a size: the substrate's own, and the named points' for every other slot. */
export function slotValues(slotting: PointSlots, namedValue: number, substrateValue: number): number[] {
    return Array.from({ length: slotting.slotCount }, (_, slot) =>
        slot === slotting.substrateSlot ? substrateValue : namedValue,
    );
}

/**
 * Every point's index in the order to draw them: the substrate's points first, then the rest in
 * their own order, so the points that name something always draw above the ground they sit on and
 * the entries among them interleave.
 */
export function drawOrder(slotting: PointSlots): number[] {
    const order: number[] = [];
    slotting.slots.forEach((slot, index) => {
        if (slot === slotting.substrateSlot) {
            order.push(index);
        }
    });
    slotting.slots.forEach((slot, index) => {
        if (slot !== slotting.substrateSlot) {
            order.push(index);
        }
    });
    return order;
}
