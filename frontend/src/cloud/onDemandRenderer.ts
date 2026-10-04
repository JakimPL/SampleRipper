import { createRenderer } from "regl-scatterplot";

/** The renderer regl-scatterplot draws through, as its own typings describe it. */
export type ScatterplotRenderer = ReturnType<typeof createRenderer>;

type FrameDraw = () => unknown;

/** A scatterplot renderer whose frame can also be drawn at once, inside the caller's own task. */
export interface OnDemandRenderer extends ScatterplotRenderer {
    /** Runs every frame callback registered through `onFrame` now, as the next animation frame would. */
    readonly drawNow: () => void;
}

/**
 * A renderer for `createScatterplot({ renderer })` that keeps the frame callbacks the scatterplot
 * registers, so a caller can draw a frame within the task it is in, and hands everything else to
 * the library's own renderer. Assigning a canvas its size clears it, and the library sizes its
 * canvas from its own ResizeObserver while drawing only on the next animation frame; a caller
 * observing the same resize draws the frame at once, so the paint that follows shows the points.
 * The scatterplot leaves a renderer it was handed alive, so its owner destroys it.
 */
export function createOnDemandRenderer(): OnDemandRenderer {
    const renderer = createRenderer();
    const frames = new Set<FrameDraw>();

    return {
        get canvas() {
            return renderer.canvas;
        },
        get regl() {
            return renderer.regl;
        },
        get gamma() {
            return renderer.gamma;
        },
        set gamma(gamma: number) {
            renderer.gamma = gamma;
        },
        get isSupported() {
            return renderer.isSupported;
        },
        get isDestroyed() {
            return renderer.isDestroyed;
        },
        render: renderer.render,
        resize: renderer.resize,
        refresh: renderer.refresh,
        destroy: renderer.destroy,
        onFrame: (draw: FrameDraw): (() => void) => {
            const cancel = renderer.onFrame(draw);
            frames.add(draw);
            return (): void => {
                frames.delete(draw);
                cancel();
            };
        },
        drawNow: (): void => {
            if (renderer.isDestroyed) {
                return;
            }
            renderer.refresh();
            for (const draw of frames) {
                draw();
            }
        },
    };
}
