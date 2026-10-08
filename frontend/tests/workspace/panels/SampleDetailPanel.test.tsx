import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../../../src/api/client";
import type * as CloudApi from "../../../src/api/cloud";
import type * as SamplesApi from "../../../src/api/samples";
import { M } from "../../../src/messages/messageIds";
import { SampleDetailPanel } from "../../../src/workspace/panels/SampleDetailPanel";
import { useSelectionStore } from "../../../src/workspace/selectionStore";
import { keyed } from "../../support/keyedMessages";

const { getSample, getSampleRelations, getSimilarSamples, getCategoryTags } = vi.hoisted(() => ({
    getSample: vi.fn(),
    getSampleRelations: vi.fn(),
    getSimilarSamples: vi.fn(),
    getCategoryTags: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../../src/api/samples", async () => {
    const actual = await vi.importActual<typeof SamplesApi>("../../../src/api/samples");
    return { ...actual, getSample, getSampleRelations, getSimilarSamples };
});

vi.mock("../../../src/api/cloud", async () => {
    const actual = await vi.importActual<typeof CloudApi>("../../../src/api/cloud");
    return { ...actual, getCategoryTags };
});

const { createWaveSurfer } = vi.hoisted(() => ({
    createWaveSurfer: vi.fn(() => ({
        on: () => () => undefined,
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        setTime: vi.fn(),
        setPlaybackRate: vi.fn(),
        setOptions: vi.fn(),
        destroy: vi.fn(),
    })),
}));

vi.mock("wavesurfer.js", () => ({
    default: { create: createWaveSurfer },
}));

function renderPanel(): ReturnType<typeof render> {
    return render(
        <MemoryRouter initialEntries={["/"]}>
            <Routes>
                <Route path="/" element={<SampleDetailPanel />} />
                <Route path="/modules/:moduleHash" element={<p>module route</p>} />
                <Route path="/samples/:sampleHash" element={<p>sample route</p>} />
            </Routes>
        </MemoryRouter>,
    );
}

const SAMPLE_DETAIL = {
    hash: "abc",
    depth: 16,
    channels: 1,
    frames: 4096,
    display_name: "kick",
    category: "BASS DRUM",
    hand_label: null,
    size_bytes: 8192,
    duration_seconds: 0.09,
    playback_rate_hz: 8363,
    playback_rates: [{ rate_hz: 8363, event_count: 1 }],
    categories: [],
    occurrences: [
        {
            properties: {
                sample_hash: "abc",
                occurrence: { module_hash: "module-1", instrument_index: 0, sample_slot: 0 },
                name: "kick",
                rate: 8363,
                volume: 64,
                tracker: "xm",
                tuning: { relative_note: 0, finetune: 0 },
            },
            module: { hash: "module-1", title: "A Song", filename: "song.xm", tracker: "xm" },
        },
    ],
    files: [],
};

describe("SampleDetailPanel", () => {
    it("asks the catalog for nothing and stands in its empty state while no sample is focused", () => {
        const { container } = renderPanel();

        expect(getSample).not.toHaveBeenCalled();
        expect(container.querySelector(".no-selection")).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: M.samples.player.save })).not.toBeInTheDocument();
    });

    it("stands the sample's transport over its detail, both from one request", async () => {
        getSample.mockResolvedValue(SAMPLE_DETAIL);
        getSampleRelations.mockResolvedValue([]);
        getSimilarSamples.mockResolvedValue([]);
        useSelectionStore.getState().focusSample("abc");

        renderPanel();

        expect(await screen.findByRole("link", { name: M.samples.player.save })).toHaveAttribute(
            "href",
            "/api/samples/abc/audio",
        );
        expect(screen.getByRole("heading", { name: "kick" })).toBeInTheDocument();
        expect(getSample).toHaveBeenCalledTimes(1);
    });

    it("shows the focused sample's detail once loaded", async () => {
        getSample.mockResolvedValue(SAMPLE_DETAIL);
        getSampleRelations.mockResolvedValue([]);
        getSimilarSamples.mockResolvedValue([]);
        useSelectionStore.getState().focusSample("abc");

        renderPanel();

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "kick" })).toBeInTheDocument();
        });
        expect(screen.getByText("abc")).toBeInTheDocument();
        expect([...document.querySelectorAll(".kv dt")].map((term) => term.textContent).slice(0, 2)).toEqual([
            M.samples.detail.label,
            M.samples.detail.categories,
        ]);
        expect(screen.queryByText(M.samples.columns.category)).not.toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: keyed(M.samples.detail.tabInfo, { count: undefined }) }),
        ).toHaveAttribute("aria-pressed", "true");
        expect(
            screen.getByRole("button", { name: keyed(M.samples.detail.tabOccurrences, { count: 1 }) }),
        ).toHaveAttribute("aria-pressed", "false");
        expect(
            screen.getByRole("button", { name: keyed(M.samples.detail.tabSimilar, { count: 0 }) }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: keyed(M.samples.detail.tabCooccurrence, { count: undefined }) }),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: keyed(M.samples.detail.tabOccurrences, { count: 1 }) }));

        expect(screen.getByRole("link", { name: "A Song" })).toHaveAttribute("href", "/modules/module-1");
    });

    it("opens on the sample's own facts, its listings in tabs beside them", async () => {
        getSample.mockResolvedValue(SAMPLE_DETAIL);
        getSampleRelations.mockResolvedValue([]);
        getSimilarSamples.mockResolvedValue([]);
        useSelectionStore.getState().focusSample("abc");

        const { container } = renderPanel();

        await screen.findByRole("heading", { name: "kick" });
        expect([...container.querySelectorAll(".detail-tabs button")].map((button) => button.textContent)).toEqual([
            keyed(M.samples.detail.tabInfo, { count: undefined }),
            keyed(M.samples.detail.tabSimilar, { count: 0 }),
            keyed(M.samples.detail.tabOccurrences, { count: 1 }),
            keyed(M.samples.detail.tabRelations, { count: 0 }),
            keyed(M.samples.detail.tabCooccurrence, { count: undefined }),
        ]);
        expect(screen.getByText(M.samples.detail.label)).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "A Song" })).not.toBeInTheDocument();
    });

    it("lists the sample files a sample was found in beside its module slots, marking a file gone since its scan and none the server reports no state for", async () => {
        getSample.mockResolvedValue({
            ...SAMPLE_DETAIL,
            occurrences: [],
            files: [
                { directory: "/packs", relative_path: "Kicks/Kick 01.wav", rate: 44100, available: true },
                { directory: "/packs", relative_path: "Kicks/Kick 02.wav", rate: 44100, available: false },
                { directory: "packs", relative_path: "Kicks/Kick 03.wav", rate: 44100, available: null },
            ],
        });
        getSampleRelations.mockResolvedValue([]);
        getSimilarSamples.mockResolvedValue([]);
        useSelectionStore.getState().focusSample("abc");

        renderPanel();

        fireEvent.click(
            await screen.findByRole("button", { name: keyed(M.samples.detail.tabOccurrences, { count: 3 }) }),
        );

        expect(screen.getByText("Kicks/Kick 01.wav")).toBeInTheDocument();
        expect(screen.getByText("Kicks/Kick 03.wav")).toBeInTheDocument();
        expect(screen.getAllByText(M.samples.fileUnavailable)).toHaveLength(1);
        expect(screen.queryByRole("link", { name: "A Song" })).not.toBeInTheDocument();
    });

    it("renders the sample's spectral neighbors on their own tab, with what a glance shows", async () => {
        getSample.mockResolvedValue(SAMPLE_DETAIL);
        getSampleRelations.mockResolvedValue([]);
        getSimilarSamples.mockResolvedValue([
            {
                hash: "d".repeat(64),
                distance: 1.5,
                playback_rate_hz: null,
                display_name: "snare_909",
                category: "SNARE",
                hand_label: null,
                thumbnail: null,
            },
        ]);
        useSelectionStore.getState().focusSample("abc");
        renderPanel();

        fireEvent.click(await screen.findByRole("button", { name: keyed(M.samples.detail.tabSimilar, { count: 1 }) }));

        expect(screen.getByText("dddddddd")).toBeInTheDocument();
        expect(screen.getByText("snare_909")).toBeInTheDocument();
        expect(screen.getByText("SNARE")).toBeInTheDocument();
        expect(screen.getByText("1.500")).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: M.samples.columns.distance })).toBeInTheDocument();
        expect(screen.queryByRole("columnheader", { name: M.samples.columns.category })).not.toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "A Song" })).not.toBeInTheDocument();
    });

    it("shows an honest empty state when the sample has no spectral neighbors yet", async () => {
        getSample.mockResolvedValue(SAMPLE_DETAIL);
        getSampleRelations.mockResolvedValue([]);
        getSimilarSamples.mockRejectedValue(new ApiError(404, "not found", null));
        useSelectionStore.getState().focusSample("abc");
        renderPanel();

        fireEvent.click(await screen.findByRole("button", { name: keyed(M.samples.detail.tabSimilar, { count: 0 }) }));

        expect(screen.getByText(M.samples.detail.noSimilar)).toBeInTheDocument();
    });

    it("keeps the chosen tab when the focus moves to another sample", async () => {
        getSample.mockImplementation((hash: string) =>
            Promise.resolve({ ...SAMPLE_DETAIL, hash, display_name: hash === "abc" ? "kick" : "snare" }),
        );
        getSampleRelations.mockResolvedValue([]);
        getSimilarSamples.mockResolvedValue([]);
        useSelectionStore.getState().focusSample("abc");
        renderPanel();
        fireEvent.click(await screen.findByRole("button", { name: keyed(M.samples.detail.tabSimilar, { count: 0 }) }));

        act(() => {
            useSelectionStore.getState().focusSample("xyz");
        });

        await screen.findByRole("heading", { name: "snare" });
        expect(screen.getByRole("button", { name: keyed(M.samples.detail.tabSimilar, { count: 0 }) })).toHaveAttribute(
            "aria-pressed",
            "true",
        );
    });

    it("shows an error notice when the sample cannot be found", async () => {
        getSample.mockRejectedValue(new Error("no sample cataloged with hash 'abc'"));
        getSampleRelations.mockResolvedValue([]);
        useSelectionStore.getState().focusSample("abc");

        renderPanel();

        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("no sample cataloged with hash 'abc'");
        });
    });

    it("highlights an occurrence's module row on a plain click and navigates to it on a double-click", async () => {
        getSample.mockResolvedValue(SAMPLE_DETAIL);
        getSampleRelations.mockResolvedValue([]);
        getSimilarSamples.mockResolvedValue([]);
        useSelectionStore.getState().focusSample("abc");
        renderPanel();
        fireEvent.click(
            await screen.findByRole("button", { name: keyed(M.samples.detail.tabOccurrences, { count: 1 }) }),
        );
        const row = await waitFor(() => screen.getByRole("row", { name: /A Song/ }));

        fireEvent.click(row, { detail: 1 });
        expect(useSelectionStore.getState().highlighted).toEqual({ kind: "module", hash: "module-1" });

        fireEvent.doubleClick(row);
        expect(await screen.findByText("module route")).toBeInTheDocument();
    });
});
