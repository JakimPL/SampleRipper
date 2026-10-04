import { describe, expect, it } from "vitest";

import type { CloudColors } from "../../src/cloud/cloudRenderSettings";
import type { CloudEntityPoint } from "../../src/cloud/geometry";
import { type PointColoring, SUBSTRATE_ONLY_COLORING, SUBSTRATE_SLOT } from "../../src/cloud/pointColoring";
import { drawOrder, paletteColors, slotPoints, slotValues } from "../../src/cloud/pointPalette";

const COLORS: CloudColors = {
    background: "#000000",
    selected: "#ffff00",
    hover: "#ffffff",
    uncategorized: "#333333",
    labels: { lightness: 0.7, chroma: 0.15 },
    trackers: { xm: "#00ff00", it: "#ff8800", mod: "#0088ff", s3m: "#ff0000" },
};

function sample(hashCharacter: string): CloudEntityPoint {
    return { ref: { kind: "sample", hash: hashCharacter.repeat(64) }, x: 0, y: 0 };
}

function module(hashCharacter: string): CloudEntityPoint {
    return { ref: { kind: "module", hash: hashCharacter.repeat(64) }, x: 0, y: 0 };
}

/** Samples "1" and "3" carry painted tags in slots 1 and 2; every other sample lies on the ground. */
const PAINTED: PointColoring = {
    slotByHash: new Map([
        ["1".repeat(64), 1],
        ["3".repeat(64), 2],
    ]),
    paints: [
        { kind: "label", rank: 4 },
        { kind: "label", rank: 9 },
    ],
};

/** Module "m" is written in a painted IT and module "n" in a painted S3M; every other module lies on the ground. */
const FORMATS: PointColoring = {
    slotByHash: new Map([
        ["m".repeat(64), 1],
        ["n".repeat(64), 2],
    ]),
    paints: [
        { kind: "tracker", format: "it" },
        { kind: "tracker", format: "s3m" },
    ],
};

describe("slotPoints", () => {
    it("gives each point its painted tag's slot and every other point the substrate's", () => {
        const slotting = slotPoints([sample("1"), sample("2")], PAINTED);

        expect(Array.from(slotting.slots)).toEqual([1, SUBSTRATE_SLOT]);
        expect(slotting.substrateSlot).toBe(SUBSTRATE_SLOT);
        expect(slotting.slotCount).toBe(3);
    });

    it("gives each module its painted format's slot and every other module the substrate's", () => {
        const slotting = slotPoints([module("m"), module("o"), module("n")], FORMATS);

        expect(Array.from(slotting.slots)).toEqual([1, SUBSTRATE_SLOT, 2]);
        expect(slotting.slotCount).toBe(3);
    });

    it("lays every point on the ground while nothing is painted yet", () => {
        const slotting = slotPoints([sample("1"), module("m")], SUBSTRATE_ONLY_COLORING);

        expect(Array.from(slotting.slots)).toEqual([SUBSTRATE_SLOT, SUBSTRATE_SLOT]);
        expect(slotting.slotCount).toBe(1);
    });

    it("slots an empty batch with the palette its coloring paints", () => {
        const slotting = slotPoints([], PAINTED);

        expect(slotting.slots).toHaveLength(0);
        expect(slotting.slotCount).toBe(3);
    });
});

describe("paletteColors", () => {
    it("paints the substrate first and one color per painted tag after it", () => {
        const palette = paletteColors(PAINTED, COLORS);

        expect(palette).toHaveLength(3);
        expect(palette[0]).toBe(COLORS.uncategorized);
        expect(new Set(palette).size).toBe(3);
    });

    it("paints each painted format in its stamp's color, after the substrate", () => {
        expect(paletteColors(FORMATS, COLORS)).toEqual([COLORS.uncategorized, COLORS.trackers.it, COLORS.trackers.s3m]);
    });
});

describe("slotValues", () => {
    it("gives the substrate's slot its own value and every other slot the named points' one", () => {
        const slotting = slotPoints([sample("1"), sample("2")], PAINTED);

        const opacities = slotValues(slotting, 0.9, 0.4);

        expect(opacities).toEqual([0.4, 0.9, 0.9]);
    });
});

describe("drawOrder", () => {
    it("draws the substrate's points first, each group in its own order", () => {
        const slotting = slotPoints([sample("1"), sample("2"), sample("3"), sample("4")], PAINTED);

        expect(drawOrder(slotting)).toEqual([1, 3, 0, 2]);
    });
});
