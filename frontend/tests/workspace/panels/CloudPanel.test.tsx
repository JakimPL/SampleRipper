import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";

import type * as CloudApi from "../../../src/api/cloud";
import type * as CurationApi from "../../../src/api/curation";
import type * as ModulesApi from "../../../src/api/modules";
import type * as MorphApi from "../../../src/api/morph";
import type * as SamplesApi from "../../../src/api/samples";
import { COARSE_POINTER_MEDIA_QUERY } from "../../../src/layout/layoutMode";
import { END_LETTERS, useMorphStore } from "../../../src/morph/morphStore";
import type * as AudioPreview from "../../../src/samples/useAudioPreview";
import { useCurationAccess } from "../../../src/samples/useCurationAccess";
import { LONG_PRESS_HOLD_MS } from "../../../src/shared/gestures/gestureThresholds";
import { CloudPanel } from "../../../src/workspace/panels/CloudPanel";
import { useSelectionStore } from "../../../src/workspace/selectionStore";
import { stubMatchMedia } from "../../support/matchMedia";
import { choosePair } from "../../support/morphPair";
import { installControllableResizeObserver, resizeTo } from "../../support/resizeObserver";

const {
    instances,
    createScatterplotMock,
    getCloud,
    getModuleCloud,
    getCloudCategories,
    getCategoryTags,
    getCloudLabels,
    getLabelTags,
    getSamplePreview,
    getSample,
    getSampleRelations,
    getSimilarSamples,
    getModule,
    getMorphStatus,
    play,
    playAnswered,
} = vi.hoisted(() => {
    class FakeScatterplot {
        readonly draw = vi.fn().mockResolvedValue(undefined);
        readonly select = vi.fn();
        readonly deselect = vi.fn();
        readonly destroy = vi.fn();
        readonly set = vi.fn().mockResolvedValue(undefined);
        readonly getScreenPosition = vi.fn((index: number) => [10 + index, 20 + index] as [number, number]);
        readonly hover = vi.fn();
        readonly redraw = vi.fn();
        readonly zoomToArea = vi.fn().mockResolvedValue(undefined);
        readonly camera = { pan: vi.fn(), scale: vi.fn() };
        readonly get = vi.fn((property: string) => {
            if (property === "cameraView") {
                return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
            }
            return property === "camera" ? this.camera : undefined;
        });
        private readonly listeners = new Map<string, ((payload: unknown) => void)[]>();

        subscribe(event: string, handler: (payload: unknown) => void): { event: string; handler: unknown } {
            const handlers = this.listeners.get(event) ?? [];
            handlers.push(handler);
            this.listeners.set(event, handlers);
            return { event, handler };
        }

        unsubscribe(): void {
            // subscriptions are torn down together with the instance in these tests
        }

        emit(event: string, payload?: unknown): void {
            for (const handler of this.listeners.get(event) ?? []) {
                handler(payload);
            }
        }
    }

    const instances: FakeScatterplot[] = [];
    const createScatterplotMock = vi.fn(() => {
        const instance = new FakeScatterplot();
        instances.push(instance);
        return instance;
    });
    return {
        instances,
        createScatterplotMock,
        getCloud: vi.fn(),
        getModuleCloud: vi.fn(),
        getCloudCategories: vi.fn().mockResolvedValue([]),
        getCategoryTags: vi.fn().mockResolvedValue([]),
        getCloudLabels: vi.fn().mockResolvedValue([]),
        getLabelTags: vi.fn().mockResolvedValue([]),
        getSamplePreview: vi.fn(),
        getSample: vi.fn().mockRejectedValue(new Error("no catalog behind this test")),
        getSampleRelations: vi.fn().mockResolvedValue([]),
        getSimilarSamples: vi.fn().mockResolvedValue([]),
        getModule: vi.fn(),
        getMorphStatus: vi.fn().mockResolvedValue({ available: true, service: null }),
        play: vi.fn(),
        playAnswered: vi.fn().mockResolvedValue(true),
    };
});

vi.mock("regl-scatterplot", () => ({
    default: createScatterplotMock,
    createRenderer: () => ({ onFrame: () => () => undefined, destroy: vi.fn(), refresh: vi.fn(), isDestroyed: false }),
}));

vi.mock("../../../src/api/cloud", async () => {
    const actual = await vi.importActual<typeof CloudApi>("../../../src/api/cloud");
    return { ...actual, getCloud, getModuleCloud, getCloudCategories, getCategoryTags, getCloudLabels };
});

vi.mock("../../../src/api/curation", async () => {
    const actual = await vi.importActual<typeof CurationApi>("../../../src/api/curation");
    return { ...actual, getLabelTags };
});

vi.mock("../../../src/api/samples", async () => {
    const actual = await vi.importActual<typeof SamplesApi>("../../../src/api/samples");
    return { ...actual, getSamplePreview, getSample, getSampleRelations, getSimilarSamples };
});

vi.mock("../../../src/samples/useAudioPreview", async () => {
    const actual = await vi.importActual<typeof AudioPreview>("../../../src/samples/useAudioPreview");
    return { ...actual, useAudioPreview: () => ({ play, playAnswered, playingKey: null, failure: null }) };
});

vi.mock("../../../src/api/morph", async () => {
    const actual = await vi.importActual<typeof MorphApi>("../../../src/api/morph");
    return { ...actual, getMorphStatus };
});

vi.mock("../../../src/api/modules", async () => {
    const actual = await vi.importActual<typeof ModulesApi>("../../../src/api/modules");
    return { ...actual, getModule };
});

const NARROW_PANEL_WIDTH_PX = 300;
const WIDE_PANEL_WIDTH_PX = 960;
const PANEL_HEIGHT_PX = 600;

function panelRect(width: number): DOMRect {
    return {
        x: 0,
        y: 0,
        width,
        height: PANEL_HEIGHT_PX,
        top: 0,
        right: width,
        bottom: PANEL_HEIGHT_PX,
        left: 0,
        toJSON: () => ({}),
    };
}

/** The panel measured `width` wide for the rest of the test, the setup's box back after it. */
function measureThePanel(width: number): void {
    const spy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect");
    const setupBox = spy.getMockImplementation();
    spy.mockReturnValue(panelRect(width));
    onTestFinished(() => {
        if (setupBox !== undefined) {
            spy.mockImplementation(setupBox);
        }
    });
}

/** The panel at a phone's width. */
function narrowThePanel(): void {
    measureThePanel(NARROW_PANEL_WIDTH_PX);
}

/** The panel wide enough for the coloring's choice and the legend to share the toolbar's row. */
function widenThePanel(): void {
    measureThePanel(WIDE_PANEL_WIDTH_PX);
}

/** What every test starts from: a renderer that answers, and a catalog that names any sample the strip offers. */
beforeEach(() => {
    getMorphStatus.mockResolvedValue({ available: true, service: null });
    getSamplePreview.mockResolvedValue({ display_name: "", category: null, hand_label: null, thumbnail: null });
    getSample.mockImplementation((hash: string) =>
        Promise.resolve({ hash, display_name: "", playback_rate_hz: 8363, duration_seconds: 0.5 }),
    );
    getSampleRelations.mockResolvedValue([]);
    getSimilarSamples.mockResolvedValue([]);
});

function latestInstance(): (typeof instances)[number] {
    const instance = instances[instances.length - 1];
    if (instance === undefined) {
        throw new Error("no FakeScatterplot instance was created");
    }
    return instance;
}

function latestCanvas(): HTMLCanvasElement {
    const canvas = document.querySelector<HTMLCanvasElement>("canvas.cloud-dots");
    if (canvas === null) {
        throw new Error("canvas not found");
    }
    return canvas;
}

/** The toolbar row an element stands in. */
function toolbarOf(element: HTMLElement): Element | null {
    return element.closest(".cloud-toolbar");
}

function renderPanel(): ReturnType<typeof render> {
    return render(
        <MemoryRouter initialEntries={["/"]}>
            <Routes>
                <Route path="/" element={<CloudPanel />} />
                <Route path="/samples/:sampleHash" element={<p>sample route</p>} />
                <Route path="/modules/:moduleHash" element={<p>module route</p>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe("CloudPanel", () => {
    it("shows a loading state before either tab's points arrive", () => {
        getCloud.mockReturnValue(new Promise(() => undefined));
        getModuleCloud.mockReturnValue(new Promise(() => undefined));

        renderPanel();

        expect(screen.getByText("Loading…")).toBeInTheDocument();
    });

    it("renders a canvas for the Samples tab once its points have loaded", async () => {
        getCloud.mockResolvedValue([{ sample_hash: "a".repeat(64), x: 0, y: 0 }]);
        getModuleCloud.mockResolvedValue([]);

        renderPanel();

        await waitFor(() => {
            expect(document.querySelector("canvas.cloud-dots")).toBeInTheDocument();
        });
    });

    it("shows an error notice when the active tab's request fails", async () => {
        getCloud.mockRejectedValue(new Error("service unavailable"));
        getModuleCloud.mockResolvedValue([]);

        renderPanel();

        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("service unavailable");
        });
    });

    it("highlights the clicked sample in the shared selection store", async () => {
        const sampleHash = "b".repeat(64);
        getCloud.mockResolvedValue([{ sample_hash: sampleHash, x: 0, y: 0 }]);
        getModuleCloud.mockResolvedValue([]);
        renderPanel();
        await waitFor(() => {
            expect(document.querySelector("canvas.cloud-dots")).toBeInTheDocument();
        });

        latestInstance().emit("select", { points: [0] });

        expect(useSelectionStore.getState().highlighted).toEqual({ kind: "sample", hash: sampleHash });
    });

    it("clears the shared highlight on a click that misses every point", async () => {
        const sampleHash = "f".repeat(64);
        getCloud.mockResolvedValue([{ sample_hash: sampleHash, x: 0, y: 0 }]);
        getModuleCloud.mockResolvedValue([]);
        renderPanel();
        await waitFor(() => {
            expect(document.querySelector("canvas.cloud-dots")).toBeInTheDocument();
        });
        useSelectionStore.getState().highlightEntity({ kind: "sample", hash: sampleHash });

        fireEvent.click(latestCanvas());

        expect(useSelectionStore.getState().highlighted).toBeNull();
    });

    it("navigates to the double-clicked sample's route", async () => {
        const sampleHash = "c".repeat(64);
        getCloud.mockResolvedValue([{ sample_hash: sampleHash, x: 0, y: 0 }]);
        getModuleCloud.mockResolvedValue([]);
        // The hover tooltip fetches a sample preview as soon as pointOver fires below.
        getSamplePreview.mockReturnValue(new Promise(() => undefined));
        renderPanel();
        await waitFor(() => {
            expect(document.querySelector("canvas.cloud-dots")).toBeInTheDocument();
        });
        latestInstance().emit("pointOver", 0);

        fireEvent.dblClick(latestCanvas());

        expect(await screen.findByText("sample route")).toBeInTheDocument();
    });

    it("switches to the Modules tab, showing its points", async () => {
        getCloud.mockResolvedValue([]);
        const moduleHash = "d".repeat(64);
        getModuleCloud.mockResolvedValue([{ module_hash: moduleHash, tracker: "xm", x: 0, y: 0 }]);
        renderPanel();

        fireEvent.click(screen.getByRole("button", { name: "Modules" }));

        await waitFor(() => {
            expect(document.querySelector("canvas.cloud-dots")).toBeInTheDocument();
        });
    });

    it("navigates to the double-clicked module's route from the Modules tab", async () => {
        getCloud.mockResolvedValue([]);
        const moduleHash = "e".repeat(64);
        getModuleCloud.mockResolvedValue([{ module_hash: moduleHash, tracker: "it", x: 0, y: 0 }]);
        // The hover tooltip fetches module detail as soon as pointOver fires below.
        getModule.mockReturnValue(new Promise(() => undefined));
        renderPanel();
        fireEvent.click(screen.getByRole("button", { name: "Modules" }));
        await waitFor(() => {
            expect(document.querySelector("canvas.cloud-dots")).toBeInTheDocument();
        });
        latestInstance().emit("pointOver", 0);

        fireEvent.dblClick(latestCanvas());

        expect(await screen.findByText("module route")).toBeInTheDocument();
    });

    it("shows a hover tooltip with the sample's name and hash", async () => {
        const sampleHash = "1".repeat(64);
        getCloud.mockResolvedValue([{ sample_hash: sampleHash, x: 0, y: 0 }]);
        getModuleCloud.mockResolvedValue([]);
        getSamplePreview.mockResolvedValue({
            display_name: "kick",
            category: null,
            hand_label: null,
            thumbnail: [],
        });
        renderPanel();
        await waitFor(() => {
            expect(document.querySelector("canvas.cloud-dots")).toBeInTheDocument();
        });

        latestInstance().emit("pointOver", 0);

        expect(await screen.findByText("kick")).toBeInTheDocument();
        expect(screen.getByText(sampleHash.slice(0, 8))).toBeInTheDocument();
    });

    it("colors by category from the start, each sample by its first pick under a legend of the tags picked first", async () => {
        widenThePanel();
        const sampleHash = "3".repeat(64);
        getCloud.mockResolvedValue([{ sample_hash: sampleHash, x: 0, y: 0 }]);
        getModuleCloud.mockResolvedValue([]);
        getCloudCategories.mockResolvedValue([{ sample_hash: sampleHash, path: ["BASS DRUM"], score: 0.8 }]);
        getCategoryTags.mockResolvedValue([{ path: ["BASS DRUM"], sample_count: 1, rank: 0 }]);
        renderPanel();

        expect(screen.getByRole("button", { name: "Category" })).toHaveAttribute("aria-pressed", "true");
        expect(screen.queryByRole("button", { name: "Legend" })).not.toBeInTheDocument();
        expect(await screen.findByRole("button", { name: /BASS DRUM/ })).toHaveAttribute("aria-pressed", "true");
        expect(toolbarOf(screen.getByRole("group", { name: "Painted tags" }))).toBe(
            toolbarOf(screen.getByRole("button", { name: "Samples" })),
        );
        await waitFor(() => {
            expect(latestInstance().draw).toHaveBeenCalledWith([[expect.any(Number), expect.any(Number), 1]], {
                zDataType: "categorical",
            });
        });
    });

    it("hides the hover tooltip once the cursor leaves the point", async () => {
        const sampleHash = "2".repeat(64);
        getCloud.mockResolvedValue([{ sample_hash: sampleHash, x: 0, y: 0 }]);
        getModuleCloud.mockResolvedValue([]);
        getSamplePreview.mockResolvedValue({
            display_name: "snare",
            category: null,
            hand_label: null,
            thumbnail: [],
        });
        renderPanel();
        await waitFor(() => {
            expect(document.querySelector("canvas.cloud-dots")).toBeInTheDocument();
        });
        latestInstance().emit("pointOver", 0);
        await screen.findByText("snare");

        latestInstance().emit("pointOut");

        await waitFor(() => {
            expect(screen.queryByText("snare")).not.toBeInTheDocument();
        });
    });

    it("plays the morph as its file states when the marker is released", async () => {
        const first = "6".repeat(64);
        const second = "7".repeat(64);
        getCloud.mockResolvedValue([
            { sample_hash: first, x: 0, y: 0, playback_rate_hz: 8363 },
            { sample_hash: second, x: 1, y: 1, playback_rate_hz: 16726 },
        ]);
        getModuleCloud.mockResolvedValue([]);
        renderPanel();
        await waitFor(() => {
            expect(document.querySelector("canvas.cloud-dots")).toBeInTheDocument();
        });
        act(() => {
            choosePair(first, second);
        });
        const marker = await screen.findByRole("slider", { name: "Morph weight" });

        fireEvent.pointerDown(marker, { pointerId: 1, clientX: 10, clientY: 20 });
        fireEvent.pointerUp(marker, { pointerId: 1, clientX: 10, clientY: 20 });

        expect(playAnswered).toHaveBeenCalledWith({
            key: `/api/morph/audio?first=${first}&second=${second}&weight=0.5`,
            url: `/api/morph/audio?first=${first}&second=${second}&weight=0.5`,
            playbackRateHz: null,
        });
        await waitFor(() => {
            expect(useMorphStore.getState().renderedWeight).toBe(0.5);
        });
    });

    it("plays no morph on a marker release while no renderer answers", async () => {
        const first = "6".repeat(64);
        const second = "7".repeat(64);
        getMorphStatus.mockResolvedValue({ available: false, service: null });
        getCloud.mockResolvedValue([
            { sample_hash: first, x: 0, y: 0, playback_rate_hz: 8363 },
            { sample_hash: second, x: 1, y: 1, playback_rate_hz: 16726 },
        ]);
        getModuleCloud.mockResolvedValue([]);
        renderPanel();
        await waitFor(() => {
            expect(getMorphStatus).toHaveBeenCalled();
        });
        act(() => {
            choosePair(first, second);
        });
        const marker = await screen.findByRole("slider", { name: "Morph weight" });

        fireEvent.pointerDown(marker, { pointerId: 1, clientX: 10, clientY: 20 });
        fireEvent.pointerUp(marker, { pointerId: 1, clientX: 10, clientY: 20 });

        expect(playAnswered).not.toHaveBeenCalled();
    });

    it("carries the morph strip over the samples cloud alone", async () => {
        getCloud.mockResolvedValue([{ sample_hash: "8".repeat(64), x: 0, y: 0, playback_rate_hz: 8363 }]);
        getModuleCloud.mockResolvedValue([]);
        renderPanel();
        await waitFor(() => {
            expect(document.querySelector("canvas.cloud-dots")).toBeInTheDocument();
        });

        expect(document.querySelector(".cloud-body")).toContainElement(screen.getByRole("region", { name: "Morph" }));

        fireEvent.click(screen.getByRole("button", { name: "Modules" }));

        expect(screen.queryByRole("region", { name: "Morph" })).not.toBeInTheDocument();
    });

    it("lifts the cloud's controls by the height the strip covers, on the samples cloud alone", async () => {
        installControllableResizeObserver();
        getCloud.mockResolvedValue([{ sample_hash: "8".repeat(64), x: 0, y: 0, playback_rate_hz: 8363 }]);
        getModuleCloud.mockResolvedValue([]);
        renderPanel();
        await waitFor(() => {
            expect(document.querySelector("canvas.cloud-dots")).toBeInTheDocument();
        });
        const body = document.querySelector<HTMLElement>(".cloud-body");
        const dock = document.querySelector(".morph-strip-dock");
        if (body === null || dock === null) {
            throw new Error("the cloud's body or the strip's dock is missing");
        }

        act(() => {
            resizeTo(dock, 600, 120);
        });
        expect(body.style.getPropertyValue("--cloud-bottom-inset")).toBe("120px");

        fireEvent.click(screen.getByRole("button", { name: "Modules" }));
        expect(body.style.getPropertyValue("--cloud-bottom-inset")).toBe("0px");
    });

    it("frames both ends of the pair with room around them on request", async () => {
        const first = "6".repeat(64);
        const second = "7".repeat(64);
        getCloud.mockResolvedValue([
            { sample_hash: first, x: 0, y: 0, playback_rate_hz: 8363 },
            { sample_hash: second, x: 1, y: 1, playback_rate_hz: 16726 },
        ]);
        getModuleCloud.mockResolvedValue([]);
        renderPanel();
        await waitFor(() => {
            expect(document.querySelector("canvas.cloud-dots")).toBeInTheDocument();
        });
        expect(screen.getByRole("button", { name: "Frame the pair" })).toBeDisabled();
        act(() => {
            choosePair(first, second);
        });
        await screen.findByRole("slider", { name: "Morph weight" });

        fireEvent.click(screen.getByRole("button", { name: "Frame the pair" }));

        const [area] = latestInstance().zoomToArea.mock.calls[0] as [Record<string, number>];
        expect(area.x).toBeCloseTo(-1.5, 5);
        expect(area.y).toBeCloseTo(-1.5, 5);
        expect(area.width).toBeCloseTo(3, 5);
        expect(area.height).toBeCloseTo(3, 5);
    });

    it("keeps the legend in the tabs' row on a site that shows no labels", async () => {
        vi.mocked(useCurationAccess).mockReturnValue({ curationShown: false, labelEditing: false });
        const sampleHash = "4".repeat(64);
        getCloud.mockResolvedValue([{ sample_hash: sampleHash, x: 0, y: 0 }]);
        getModuleCloud.mockResolvedValue([]);
        getCloudCategories.mockResolvedValue([{ sample_hash: sampleHash, path: ["PIANO"], score: 0.7 }]);
        getCategoryTags.mockResolvedValue([{ path: ["PIANO"], sample_count: 1, rank: 0 }]);
        renderPanel();

        const piano = await screen.findByRole("button", { name: /PIANO/ });

        expect(screen.queryByRole("button", { name: "Category" })).not.toBeInTheDocument();
        expect(toolbarOf(piano)).toBe(toolbarOf(screen.getByRole("button", { name: "Modules" })));
    });

    it("captions the toolbar row while the scoring names no sample", async () => {
        widenThePanel();
        getCloud.mockResolvedValue([{ sample_hash: "4".repeat(64), x: 0, y: 0 }]);
        getModuleCloud.mockResolvedValue([]);
        getCloudCategories.mockResolvedValue([]);
        getCategoryTags.mockResolvedValue([]);
        renderPanel();

        const caption = await screen.findByText(/No sample carries a category yet/);

        expect(toolbarOf(caption)).toBe(toolbarOf(screen.getByRole("button", { name: "Samples" })));
    });

    it("drops the expanded legend over the cloud, leaving the toolbar one row", async () => {
        widenThePanel();
        const sampleHash = "5".repeat(64);
        getCloud.mockResolvedValue([{ sample_hash: sampleHash, x: 0, y: 0 }]);
        getModuleCloud.mockResolvedValue([]);
        getCloudCategories.mockResolvedValue([{ sample_hash: sampleHash, path: ["TAG 0"], score: 0.7 }]);
        getCategoryTags.mockResolvedValue(
            Array.from({ length: 10 }, (_, rank) => ({ path: [`TAG ${String(rank)}`], sample_count: 10 - rank, rank })),
        );
        renderPanel();

        fireEvent.click(await screen.findByRole("button", { name: "+2 more" }));

        const hidden = screen.getByRole("button", { name: /TAG 9/ });
        expect(hidden).toHaveAttribute("aria-pressed", "false");
        expect(hidden.closest(".tag-legend-overlay")).not.toBeNull();
        fireEvent.pointerDown(latestCanvas());
        expect(screen.queryByRole("button", { name: /TAG 9/ })).not.toBeInTheDocument();
    });

    it("paints each module in its format's color under a legend of the formats the cloud holds", async () => {
        const xmHashes = ["a".repeat(64), "b".repeat(64)];
        const itHash = "c".repeat(64);
        getCloud.mockResolvedValue([]);
        getModuleCloud.mockResolvedValue([
            { module_hash: xmHashes[0], tracker: "xm", x: 0, y: 0 },
            { module_hash: itHash, tracker: "it", x: 1, y: 1 },
            { module_hash: xmHashes[1], tracker: "xm", x: -1, y: 1 },
        ]);
        renderPanel();
        fireEvent.click(screen.getByRole("button", { name: "Modules" }));

        const legend = await screen.findByRole("group", { name: "Painted formats" });
        const chips = within(legend).getAllByRole("button");
        expect(chips.map((chip) => chip.textContent)).toEqual(["XM2", "IT1"]);
        expect(chips.every((chip) => chip.getAttribute("aria-pressed") === "true")).toBe(true);
        expect(toolbarOf(legend)).toBe(toolbarOf(screen.getByRole("button", { name: "Modules" })));
        await waitFor(() => {
            expect(latestInstance().draw).toHaveBeenLastCalledWith(
                [
                    [expect.any(Number), expect.any(Number), 1],
                    [expect.any(Number), expect.any(Number), 2],
                    [expect.any(Number), expect.any(Number), 1],
                ],
                { zDataType: "categorical" },
            );
        });

        fireEvent.click(within(legend).getByRole("button", { name: /IT/ }));

        expect(within(legend).getByRole("button", { name: /IT/ })).toHaveAttribute("aria-pressed", "false");
        await waitFor(() => {
            expect(latestInstance().draw).toHaveBeenLastCalledWith(
                [
                    [expect.any(Number), expect.any(Number), 1],
                    [expect.any(Number), expect.any(Number), 0],
                    [expect.any(Number), expect.any(Number), 1],
                ],
                { zDataType: "categorical" },
            );
        });
    });

    it("gives a right-clicked sample to the end opposite the selected one, keeping the selection, and plays it", async () => {
        const first = "6".repeat(64);
        const second = "7".repeat(64);
        getCloud.mockResolvedValue([
            { sample_hash: first, x: 0, y: 0, playback_rate_hz: 8363 },
            { sample_hash: second, x: 1, y: 1, playback_rate_hz: 16726 },
        ]);
        getModuleCloud.mockResolvedValue([]);
        getSamplePreview.mockReturnValue(new Promise(() => undefined));
        renderPanel();
        await waitFor(() => {
            expect(document.querySelector("canvas.cloud-dots")).toBeInTheDocument();
        });
        act(() => {
            useMorphStore.getState().takeSample(first);
            useMorphStore.getState().selectEnd("first");
        });
        latestInstance().emit("pointOver", 1);

        fireEvent.pointerDown(latestCanvas(), { pointerId: 1, pointerType: "mouse", button: 2 });
        fireEvent.contextMenu(latestCanvas());

        expect(useMorphStore.getState()).toMatchObject({ first, second, selectedEnd: "first" });
        expect(useSelectionStore.getState().highlighted).toEqual({ kind: "sample", hash: second });
        expect(play).toHaveBeenCalledWith(expect.objectContaining({ key: second, playbackRateHz: 16726 }));
    });

    it("turns the morph off from its switch, the pair waiting, and back on", async () => {
        const first = "6".repeat(64);
        const second = "7".repeat(64);
        getCloud.mockResolvedValue([
            { sample_hash: first, x: 0, y: 0, playback_rate_hz: 8363 },
            { sample_hash: second, x: 1, y: 1, playback_rate_hz: 16726 },
        ]);
        getModuleCloud.mockResolvedValue([]);
        renderPanel();
        await waitFor(() => {
            expect(document.querySelector("canvas.cloud-dots")).toBeInTheDocument();
        });
        act(() => {
            useMorphStore.getState().takeSample(first);
        });
        const morphSwitch = screen.getByRole("button", { name: "Morph" });
        expect(morphSwitch).toHaveAttribute("aria-pressed", "true");

        fireEvent.click(morphSwitch);
        latestInstance().emit("select", { points: [1] });

        expect(morphSwitch).toHaveAttribute("aria-pressed", "false");
        expect(screen.queryByRole("region", { name: "Morph" })).not.toBeInTheDocument();
        expect(useMorphStore.getState()).toMatchObject({ first, second: null });
        expect(play).toHaveBeenCalledWith(expect.objectContaining({ key: second }));

        act(() => {
            choosePair(first, second);
        });
        expect(screen.queryByRole("slider", { name: "Morph weight" })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Frame the pair" })).toBeDisabled();

        fireEvent.click(morphSwitch);

        expect(await screen.findByRole("slider", { name: "Morph weight" })).toBeInTheDocument();
        expect(screen.getByRole("region", { name: "Morph" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Frame the pair" })).toBeEnabled();
    });

    it("keeps the Morph switch to the samples cloud", async () => {
        getCloud.mockResolvedValue([]);
        getModuleCloud.mockResolvedValue([{ module_hash: "d".repeat(64), tracker: "xm", x: 0, y: 0 }]);
        renderPanel();

        fireEvent.click(screen.getByRole("button", { name: "Modules" }));
        await waitFor(() => {
            expect(document.querySelector("canvas.cloud-dots")).toBeInTheDocument();
        });

        expect(screen.queryByRole("button", { name: "Morph" })).not.toBeInTheDocument();
    });

    it("asks for the hand labels and their tags only once the Labels mode is chosen", async () => {
        widenThePanel();
        const sampleHash = "8".repeat(64);
        getCloud.mockResolvedValue([{ sample_hash: sampleHash, x: 0, y: 0 }]);
        getModuleCloud.mockResolvedValue([]);
        renderPanel();
        await waitFor(() => {
            expect(document.querySelector("canvas.cloud-dots")).toBeInTheDocument();
        });

        expect(getCloudCategories).toHaveBeenCalledTimes(1);
        expect(getCloudLabels).not.toHaveBeenCalled();
        expect(getLabelTags).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: "Labels" }));

        await waitFor(() => {
            expect(getCloudLabels).toHaveBeenCalledTimes(1);
        });
        expect(getLabelTags).toHaveBeenCalledTimes(1);
    });
});

describe("CloudPanel on touch", () => {
    const FIRST_HASH = "7".repeat(64);
    const SECOND_HASH = "8".repeat(64);
    const FINGER = { pointerId: 1, pointerType: "touch" };

    afterEach(() => {
        vi.useRealTimers();
    });

    /** The panel with two samples drawn: at (0, 600) and (600, 0) of the 600px test surface. */
    async function renderedPanel(): Promise<void> {
        getCloud.mockResolvedValue([
            { sample_hash: FIRST_HASH, x: 0, y: 0, playback_rate_hz: 8363 },
            { sample_hash: SECOND_HASH, x: 1, y: 1, playback_rate_hz: 16726 },
        ]);
        getModuleCloud.mockResolvedValue([]);
        renderPanel();
        await waitFor(() => {
            expect(document.querySelector("canvas.cloud-dots")).toBeInTheDocument();
        });
        await act(async () => {
            await Promise.resolve();
        });
    }

    function tap(x: number, y: number): void {
        fireEvent.pointerDown(latestCanvas(), { ...FINGER, clientX: x, clientY: y });
        fireEvent.pointerUp(latestCanvas(), { ...FINGER, clientX: x, clientY: y });
    }

    it("gives every tapped point to the selected end, playing each, the selection staying where it was put", async () => {
        await renderedPanel();

        tap(5, 595);
        expect(useMorphStore.getState()).toMatchObject({ first: FIRST_HASH, second: null, selectedEnd: "first" });
        act(() => {
            useMorphStore.getState().selectEnd("second");
        });
        tap(595, 5);
        expect(useMorphStore.getState()).toMatchObject({
            first: FIRST_HASH,
            second: SECOND_HASH,
            selectedEnd: "second",
        });
        expect(play).toHaveBeenCalledTimes(2);
    });

    it("shows a tap card for the point in hand under touch, playing it as the tap lands", async () => {
        stubMatchMedia(new Set([COARSE_POINTER_MEDIA_QUERY]));
        getSamplePreview.mockResolvedValue({ display_name: "kick", category: null, hand_label: null, thumbnail: null });
        await renderedPanel();

        tap(5, 595);

        await waitFor(() => {
            expect(screen.getByRole("region", { name: "Tapped point" })).toHaveTextContent("kick");
        });
        expect(play).toHaveBeenCalledWith(expect.objectContaining({ key: FIRST_HASH, playbackRateHz: 8363 }));
    });

    it("offers to make a held sample the end opposite the selected one", async () => {
        await renderedPanel();
        act(() => {
            useMorphStore.getState().takeSample(SECOND_HASH);
            useMorphStore.getState().selectEnd("first");
        });
        vi.useFakeTimers();

        fireEvent.pointerDown(latestCanvas(), { ...FINGER, clientX: 5, clientY: 595 });
        act(() => {
            vi.advanceTimersByTime(LONG_PRESS_HOLD_MS);
        });
        fireEvent.pointerUp(latestCanvas(), { ...FINGER, clientX: 5, clientY: 595 });
        vi.useRealTimers();

        const menu = screen.getByRole("dialog", { name: `Sample ${FIRST_HASH.slice(0, 8)}` });
        fireEvent.click(within(menu).getByRole("button", { name: `Use as ${END_LETTERS.second}` }));

        expect(useMorphStore.getState()).toMatchObject({
            first: SECOND_HASH,
            second: FIRST_HASH,
            selectedEnd: "first",
        });
        expect(play).toHaveBeenCalledWith(expect.objectContaining({ key: FIRST_HASH }));
    });

    it("opens a held point's menu, which opens the point", async () => {
        await renderedPanel();
        vi.useFakeTimers();

        fireEvent.pointerDown(latestCanvas(), { ...FINGER, clientX: 5, clientY: 595 });
        act(() => {
            vi.advanceTimersByTime(LONG_PRESS_HOLD_MS);
        });
        fireEvent.pointerUp(latestCanvas(), { ...FINGER, clientX: 5, clientY: 595 });
        vi.useRealTimers();

        const menu = screen.getByRole("dialog", { name: `Sample ${FIRST_HASH.slice(0, 8)}` });
        fireEvent.click(within(menu).getByRole("button", { name: "Open" }));

        expect(await screen.findByText("sample route")).toBeInTheDocument();
    });

    it("opens a module tapped twice from the Modules tab", async () => {
        getCloud.mockResolvedValue([]);
        getModuleCloud.mockResolvedValue([
            { module_hash: FIRST_HASH, tracker: "mod", x: 0, y: 0 },
            { module_hash: SECOND_HASH, tracker: "s3m", x: 1, y: 1 },
        ]);
        getModule.mockReturnValue(new Promise(() => undefined));
        renderPanel();
        fireEvent.click(screen.getByRole("button", { name: "Modules" }));
        await waitFor(() => {
            expect(document.querySelector("canvas.cloud-dots")).toBeInTheDocument();
        });
        await act(async () => {
            await Promise.resolve();
        });

        tap(5, 595);
        tap(5, 595);

        expect(await screen.findByText("module route")).toBeInTheDocument();
    });

    it("moves the legend into its sheet in a panel too narrow for the coloring's choice beside it", async () => {
        getCloudCategories.mockResolvedValue([{ sample_hash: FIRST_HASH, path: ["BASS DRUM"], score: 0.8 }]);
        getCategoryTags.mockResolvedValue([{ path: ["BASS DRUM"], sample_count: 1, rank: 0 }]);
        await renderedPanel();

        const legend = await screen.findByRole("button", { name: "Legend" });

        expect(toolbarOf(legend)).toBe(toolbarOf(screen.getByRole("button", { name: "Samples" })));
        expect(screen.queryByRole("button", { name: "Category" })).not.toBeInTheDocument();
        expect(screen.queryByRole("group", { name: "Painted tags" })).not.toBeInTheDocument();
    });

    it("keeps the format chips in the row of a narrow panel's Modules tab", async () => {
        narrowThePanel();
        getCloud.mockResolvedValue([]);
        getModuleCloud.mockResolvedValue([{ module_hash: FIRST_HASH, tracker: "s3m", x: 0, y: 0 }]);
        renderPanel();
        fireEvent.click(screen.getByRole("button", { name: "Modules" }));

        const chip = await screen.findByRole("button", { name: /S3M/ });

        expect(toolbarOf(chip)).toBe(toolbarOf(screen.getByRole("button", { name: "Modules" })));
        expect(screen.queryByRole("button", { name: "Legend" })).not.toBeInTheDocument();
    });

    it("moves the legend and the coloring's choice into a sheet in a narrow panel", async () => {
        narrowThePanel();
        getCloudCategories.mockResolvedValue([{ sample_hash: FIRST_HASH, path: ["BASS DRUM"], score: 0.8 }]);
        getCategoryTags.mockResolvedValue([{ path: ["BASS DRUM"], sample_count: 1, rank: 0 }]);
        await renderedPanel();

        expect(screen.queryByRole("button", { name: "Category" })).not.toBeInTheDocument();
        fireEvent.click(await screen.findByRole("button", { name: "Legend" }));

        const sheet = screen.getByRole("dialog", { name: "Legend" });
        expect(within(sheet).getByRole("group", { name: "Color by" })).toBeInTheDocument();
        expect(within(sheet).getByRole("button", { name: "Category" })).toHaveAttribute("aria-pressed", "true");
        expect(screen.queryByRole("group", { name: "Painted tags", hidden: false })).toBe(
            within(sheet).getByRole("group", { name: "Painted tags" }),
        );
        fireEvent.click(within(sheet).getByRole("button", { name: /BASS DRUM/ }));
        expect(within(sheet).getByRole("button", { name: /BASS DRUM/ })).toHaveAttribute("aria-pressed", "false");
    });

    it("keeps the coloring's choice in the sheet before any tag is painted", async () => {
        narrowThePanel();
        getCloudCategories.mockResolvedValue([]);
        getCategoryTags.mockResolvedValue([]);
        await renderedPanel();

        fireEvent.click(screen.getByRole("button", { name: "Legend" }));

        const sheet = screen.getByRole("dialog", { name: "Legend" });
        expect(within(sheet).getByText(/No sample carries a category yet/)).toBeInTheDocument();
        fireEvent.click(within(sheet).getByRole("button", { name: "Labels" }));
        expect(within(sheet).getByRole("button", { name: "Labels" })).toHaveAttribute("aria-pressed", "true");
        expect(await within(sheet).findByText(/No sample carries a label yet/)).toBeInTheDocument();
        await waitFor(() => {
            expect(getCloudLabels).toHaveBeenCalled();
        });
    });

    it("steps the zoom and centers on the point in hand from the tools", async () => {
        await renderedPanel();

        fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
        expect(latestInstance().camera.scale).toHaveBeenCalledWith([1.5, 1.5], [0, 0]);
        expect(screen.getByRole("button", { name: "Center on the selection" })).toBeDisabled();

        act(() => {
            useSelectionStore.getState().highlightEntity({ kind: "sample", hash: SECOND_HASH });
        });
        fireEvent.click(screen.getByRole("button", { name: "Center on the selection" }));

        expect(latestInstance().zoomToArea).toHaveBeenCalledTimes(1);
    });
});
