import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type * as CurationApi from "../../src/api/curation";
import type { SampleSummary } from "../../src/api/samples";
import { M } from "../../src/messages/messageIds";
import { RowActionSheet } from "../../src/samples/RowActionSheet";
import { keyed } from "../support/keyedMessages";

const { getLabelVocabulary } = vi.hoisted(() => ({ getLabelVocabulary: vi.fn().mockResolvedValue([]) }));

vi.mock("../../src/api/curation", async () => {
    const actual = await vi.importActual<typeof CurationApi>("../../src/api/curation");
    return { ...actual, getLabelVocabulary };
});

const SAMPLE: SampleSummary = {
    hash: "abc123",
    display_name: "kick",
    category: null,
    hand_label: null,
    rating: null,
    favorite: false,
    occurrence_count: 1,
    depth: 16,
    channels: 1,
    frames: 4096,
    size_bytes: 8192,
    thumbnail: null,
    playback_rate_hz: null,
    equivalence_class_hash: null,
    equivalence_member_count: 1,
};

const NOTHING = { label: null, rating: null, favorite: false };

function renderSheet(
    onChange: ((changes: CurationApi.AnnotationChanges) => void) | null = vi.fn(),
    onClose = vi.fn(),
): void {
    render(
        <MemoryRouter initialEntries={["/"]}>
            <Routes>
                <Route
                    path="/"
                    element={
                        <RowActionSheet sample={SAMPLE} decisions={NOTHING} onChange={onChange} onClose={onClose} />
                    }
                />
                <Route path="/samples/:sampleHash" element={<p>sample route</p>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe("RowActionSheet", () => {
    it("names the sample and offers its stars and heart at once", () => {
        const onChange = vi.fn();
        renderSheet(onChange);

        expect(screen.getByRole("dialog", { name: "kick" })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: keyed(M.samples.rating.rate, { value: 4 }) }));
        fireEvent.click(screen.getByRole("button", { name: M.samples.favorite.yes }));

        expect(onChange).toHaveBeenCalledWith({ rating: 4 });
        expect(onChange).toHaveBeenCalledWith({ favorite: true });
    });

    it("opens the sample from its action", async () => {
        renderSheet();

        fireEvent.click(screen.getByRole("button", { name: M.samples.rowActions.open }));

        expect(await screen.findByText("sample route")).toBeInTheDocument();
    });

    it("turns into the label sheet on Label", () => {
        renderSheet();

        fireEvent.click(screen.getByRole("button", { name: M.samples.label.openSheet }));

        expect(screen.getByRole("dialog", { name: M.samples.label.sheetTitle })).toBeInTheDocument();
    });

    it("keeps its actions alone where labels may only be seen", () => {
        renderSheet(null);

        expect(screen.getByRole("button", { name: M.samples.rowActions.play })).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: keyed(M.samples.rating.rate, { value: 4 }) }),
        ).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: M.samples.favorite.yes })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: M.samples.label.openSheet })).not.toBeInTheDocument();
    });
});
