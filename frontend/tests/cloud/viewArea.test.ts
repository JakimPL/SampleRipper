import { describe, expect, it } from "vitest";

import type { CloudEntityPoint } from "../../src/cloud/geometry";
import { areaAboveInset, frameArea, locateArea, type ViewArea } from "../../src/cloud/viewArea";
import type { Viewport } from "../../src/cloud/viewTransform";

const PRECISION = 9;
const TOLERANCE = 1e-9;

function samplePoint(x: number, y: number): CloudEntityPoint {
    return { ref: { kind: "sample", hash: "a".repeat(64) }, x, y };
}

interface ScreenBox {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
}

/**
 * Where `target` lands on screen once regl-scatterplot's `zoomToArea` has fitted `area`: the camera
 * looks at the area's center from the distance that fits the area's height, or its width over the
 * viewport's aspect, and half the viewport's height is one unit of that distance.
 */
function screenBoxAfterZoom(area: ViewArea, target: ViewArea, viewport: Viewport): ScreenBox {
    const aspect = viewport.widthPx / viewport.heightPx;
    const distance = area.height * aspect >= area.width ? area.height / 2 : area.width / 2 / aspect;
    const centerX = area.x + area.width / 2;
    const centerY = area.y + area.height / 2;
    const unitPx = viewport.heightPx / 2 / distance;
    return {
        left: viewport.widthPx / 2 + (target.x - centerX) * unitPx,
        right: viewport.widthPx / 2 + (target.x + target.width - centerX) * unitPx,
        top: viewport.heightPx / 2 - (target.y + target.height - centerY) * unitPx,
        bottom: viewport.heightPx / 2 - (target.y - centerY) * unitPx,
    };
}

/** A target, the viewport it is shown in, and the height of the strip over that viewport's bottom edge. */
interface AimCase {
    readonly name: string;
    readonly target: ViewArea;
    readonly viewport: Viewport;
    readonly insetPx: number;
}

const AIM_CASES: readonly AimCase[] = [
    {
        name: "a square target in a square viewport under a strip",
        target: { x: -1.15, y: -1.15, width: 0.3, height: 0.3 },
        viewport: { widthPx: 600, heightPx: 600, devicePixelRatio: 1 },
        insetPx: 200,
    },
    {
        name: "a square target in a wide viewport, which its height fits",
        target: { x: 0.2, y: -0.4, width: 0.5, height: 0.5 },
        viewport: { widthPx: 1200, heightPx: 500, devicePixelRatio: 2 },
        insetPx: 120,
    },
    {
        name: "a wide target in a narrow phone viewport, which its width fits",
        target: { x: -0.9, y: 0.1, width: 1.6, height: 0.2 },
        viewport: { widthPx: 390, heightPx: 640, devicePixelRatio: 3 },
        insetPx: 180,
    },
    {
        name: "a target with no strip over the viewport",
        target: { x: -0.5, y: -0.25, width: 1, height: 0.5 },
        viewport: { widthPx: 800, heightPx: 600, devicePixelRatio: 1 },
        insetPx: 0,
    },
];

describe("areaAboveInset", () => {
    it.each(AIM_CASES)("fits and centers $name in the uncovered part", ({ target, viewport, insetPx }: AimCase) => {
        const uncoveredHeightPx = viewport.heightPx - insetPx;

        const box = screenBoxAfterZoom(areaAboveInset(target, viewport, insetPx), target, viewport);

        expect((box.left + box.right) / 2).toBeCloseTo(viewport.widthPx / 2, PRECISION);
        expect((box.top + box.bottom) / 2).toBeCloseTo(uncoveredHeightPx / 2, PRECISION);
        expect(box.left).toBeGreaterThanOrEqual(-TOLERANCE);
        expect(box.top).toBeGreaterThanOrEqual(-TOLERANCE);
        expect(box.right).toBeLessThanOrEqual(viewport.widthPx + TOLERANCE);
        expect(box.bottom).toBeLessThanOrEqual(uncoveredHeightPx + TOLERANCE);
        const fillsWidth = Math.abs(box.right - box.left - viewport.widthPx) < TOLERANCE;
        const fillsHeight = Math.abs(box.bottom - box.top - uncoveredHeightPx) < TOLERANCE;
        expect(fillsWidth || fillsHeight).toBe(true);
    });

    it("gives the target back under a strip covering the whole viewport", () => {
        const target: ViewArea = { x: 0, y: 0, width: 0.3, height: 0.3 };

        expect(areaAboveInset(target, { widthPx: 400, heightPx: 300, devicePixelRatio: 1 }, 300)).toBe(target);
    });
});

describe("locateArea", () => {
    it("centers a square on the point", () => {
        const area = locateArea(samplePoint(0.5, -0.5));

        expect(area).not.toBeNull();
        expect((area?.x ?? 0) + (area?.width ?? 0) / 2).toBeCloseTo(0.5, PRECISION);
        expect((area?.y ?? 0) + (area?.height ?? 0) / 2).toBeCloseTo(-0.5, PRECISION);
        expect(area?.width).toBe(area?.height);
    });

    it("has nothing to show for a point out of view", () => {
        expect(locateArea(null)).toBeNull();
    });
});

describe("frameArea", () => {
    it("holds both ends with room around them, centered between them", () => {
        const area = frameArea(samplePoint(-1, -1), samplePoint(1, 1));

        expect(area).toEqual({ x: -1.5, y: -1.5, width: 3, height: 3 });
    });

    it("has nothing to frame while an end is out of view", () => {
        expect(frameArea(samplePoint(0, 0), null)).toBeNull();
    });
});
