import type { CloudEntityPoint } from "./geometry";
import type { Viewport } from "./viewTransform";

/** A rectangle of the normalized data space, from its lower-left corner, as `zoomToArea` takes it. */
export interface ViewArea {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

const HALF = 0.5;
/** The side, in data units, of the box a locate brings into view around its point. */
const LOCATE_SPAN = 0.3;
const LOCATE_HALF_SPAN = LOCATE_SPAN * HALF;
/** How much room a framed pair gets around it, as a share of the distance between its ends. */
const FRAME_MARGIN_SHARE = 0.5;

/** The square of the locate span around one point. */
export function locateArea(point: CloudEntityPoint | null): ViewArea | null {
    if (point === null) {
        return null;
    }
    return { x: point.x - LOCATE_HALF_SPAN, y: point.y - LOCATE_HALF_SPAN, width: LOCATE_SPAN, height: LOCATE_SPAN };
}

/** The square holding both ends of a pair with room around them, at least the locate span across. */
export function frameArea(first: CloudEntityPoint | null, second: CloudEntityPoint | null): ViewArea | null {
    if (first === null || second === null) {
        return null;
    }
    const extent = Math.max(Math.abs(first.x - second.x), Math.abs(first.y - second.y));
    const span = Math.max(extent * (1 + FRAME_MARGIN_SHARE), LOCATE_SPAN);
    const centerX = (first.x + second.x) * HALF;
    const centerY = (first.y + second.y) * HALF;
    return { x: centerX - span * HALF, y: centerY - span * HALF, width: span, height: span };
}

/**
 * The area to hand regl-scatterplot's `zoomToArea` so that `target` fits the part of the
 * viewport above a strip `insetPx` tall along its bottom edge, centered in that part.
 *
 * `zoomToArea` centers the camera on the area's center and fits the whole area into the viewport,
 * keeping the data square. The area returned is therefore the whole view wanted, as wide as the
 * viewport's aspect makes it, so the library fits it exactly: its height is the smallest that
 * fits `target` across the full width and within the uncovered height, and its center sits below
 * the target's by half the inset in data units, which lifts the target to the uncovered part's
 * middle. A viewport with no uncovered height or no size gives `target` back as it is.
 */
export function areaAboveInset(target: ViewArea, viewport: Viewport, insetPx: number): ViewArea {
    const coveredHeightPx = Math.max(0, insetPx);
    const uncoveredHeightPx = viewport.heightPx - coveredHeightPx;
    if (viewport.widthPx <= 0 || viewport.heightPx <= 0 || uncoveredHeightPx <= 0) {
        return target;
    }
    const aspect = viewport.widthPx / viewport.heightPx;
    const viewHeight = Math.max((target.height * viewport.heightPx) / uncoveredHeightPx, target.width / aspect);
    const viewWidth = viewHeight * aspect;
    const dataPerPixel = viewHeight / viewport.heightPx;
    const centerX = target.x + target.width * HALF;
    const centerY = target.y + target.height * HALF - coveredHeightPx * HALF * dataPerPixel;
    return {
        x: centerX - viewWidth * HALF,
        y: centerY - viewHeight * HALF,
        width: viewWidth,
        height: viewHeight,
    };
}
