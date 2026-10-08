import { beforeEach, describe, expect, it, vi } from "vitest";

import { createOnDemandRenderer } from "../../src/cloud/onDemandRenderer";

const { library, createRendererMock } = vi.hoisted(() => {
    /** The library's renderer as far as the wrapper reaches it: its frame callbacks, its getters and its methods. */
    const library = {
        frames: new Set<() => unknown>(),
        destroyed: false,
        gamma: 2.2,
        canvas: document.createElement("canvas"),
        regl: { name: "regl" },
        isSupported: true,
        refresh: vi.fn(),
        resize: vi.fn(),
        destroy: vi.fn(),
        reset(): void {
            this.frames.clear();
            this.destroyed = false;
            this.gamma = 2.2;
        },
    };
    const createRendererMock = vi.fn(() => ({
        get canvas(): HTMLCanvasElement {
            return library.canvas;
        },
        get regl(): object {
            return library.regl;
        },
        get gamma(): number {
            return library.gamma;
        },
        set gamma(gamma: number) {
            library.gamma = gamma;
        },
        get isSupported(): boolean {
            return library.isSupported;
        },
        get isDestroyed(): boolean {
            return library.destroyed;
        },
        refresh: library.refresh,
        resize: library.resize,
        destroy: library.destroy,
        onFrame: (draw: () => unknown): (() => void) => {
            library.frames.add(draw);
            return () => {
                library.frames.delete(draw);
            };
        },
    }));
    return { library, createRendererMock };
});

vi.mock("regl-scatterplot", () => ({ createRenderer: createRendererMock }));

beforeEach(() => {
    library.reset();
    vi.clearAllMocks();
});

describe("createOnDemandRenderer", () => {
    it("runs every frame registered on it at once, refreshing the library's renderer first", () => {
        const renderer = createOnDemandRenderer();
        const first = vi.fn();
        const second = vi.fn();
        renderer.onFrame(first);
        renderer.onFrame(second);

        renderer.drawNow();

        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
        expect(library.refresh.mock.invocationCallOrder[0]).toBeLessThan(first.mock.invocationCallOrder[0] ?? 0);
    });

    it("registers each frame with the library's renderer too, so the animation frames keep running it", () => {
        const renderer = createOnDemandRenderer();
        const frame = vi.fn();

        renderer.onFrame(frame);

        expect(library.frames.has(frame)).toBe(true);
    });

    it("lets a frame go from both once its registration is canceled", () => {
        const renderer = createOnDemandRenderer();
        const frame = vi.fn();
        const cancel = renderer.onFrame(frame);

        cancel();
        renderer.drawNow();

        expect(frame).not.toHaveBeenCalled();
        expect(library.frames.has(frame)).toBe(false);
    });

    it("draws nothing once the library's renderer is destroyed", () => {
        const renderer = createOnDemandRenderer();
        const frame = vi.fn();
        renderer.onFrame(frame);

        library.destroyed = true;
        renderer.drawNow();

        expect(frame).not.toHaveBeenCalled();
    });

    it("reads and writes through to the library's renderer", () => {
        const renderer = createOnDemandRenderer();

        renderer.gamma = 1.5;
        renderer.resize(100, 50);
        renderer.destroy();

        expect(library.gamma).toBe(1.5);
        expect(renderer.gamma).toBe(1.5);
        expect(renderer.canvas).toBe(library.canvas);
        expect(renderer.regl).toBe(library.regl);
        expect(renderer.isSupported).toBe(true);
        expect(library.resize).toHaveBeenCalledWith(100, 50);
        expect(library.destroy).toHaveBeenCalledTimes(1);
    });

    it("reports the library's renderer destroyed as it is", () => {
        const renderer = createOnDemandRenderer();
        expect(renderer.isDestroyed).toBe(false);

        library.destroyed = true;

        expect(renderer.isDestroyed).toBe(true);
    });
});
