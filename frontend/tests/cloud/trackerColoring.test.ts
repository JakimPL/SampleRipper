import { describe, expect, it } from "vitest";

import type { ModuleCloudPoint } from "../../src/api/cloud";
import { trackerColoring, trackerCounts } from "../../src/cloud/trackerColoring";

const POINTS: readonly ModuleCloudPoint[] = [
    { module_hash: "a".repeat(64), tracker: "it", x: 0, y: 0 },
    { module_hash: "b".repeat(64), tracker: "xm", x: 1, y: 0 },
    { module_hash: "c".repeat(64), tracker: "mod", x: 0, y: 1 },
    { module_hash: "d".repeat(64), tracker: "xm", x: 1, y: 1 },
];

describe("trackerCounts", () => {
    it("lists each format the cloud holds with its module count, most modules first and ties by name", () => {
        expect(trackerCounts(POINTS)).toEqual([
            { format: "xm", moduleCount: 2 },
            { format: "it", moduleCount: 1 },
            { format: "mod", moduleCount: 1 },
        ]);
    });

    it("lists nothing for an empty cloud", () => {
        expect(trackerCounts([])).toEqual([]);
    });
});

describe("trackerColoring", () => {
    it("gives every module of a painted format that format's slot, in the order the formats are painted", () => {
        const coloring = trackerColoring(POINTS, ["xm", "mod"]);

        expect(coloring.paints).toEqual([
            { kind: "tracker", format: "xm" },
            { kind: "tracker", format: "mod" },
        ]);
        expect(coloring.slotByHash.get("b".repeat(64))).toBe(1);
        expect(coloring.slotByHash.get("d".repeat(64))).toBe(1);
        expect(coloring.slotByHash.get("c".repeat(64))).toBe(2);
    });

    it("leaves a module of a format nobody paints to the substrate", () => {
        const coloring = trackerColoring(POINTS, ["xm"]);

        expect(coloring.slotByHash.has("a".repeat(64))).toBe(false);
        expect(coloring.slotByHash.has("c".repeat(64))).toBe(false);
    });

    it("paints a format the cloud holds no module of without placing any point in it", () => {
        const coloring = trackerColoring(POINTS, ["s3m"]);

        expect(coloring.paints).toEqual([{ kind: "tracker", format: "s3m" }]);
        expect(coloring.slotByHash.size).toBe(0);
    });
});
