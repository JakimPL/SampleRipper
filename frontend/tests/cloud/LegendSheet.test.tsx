import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ColoringMode } from "../../src/cloud/ColoringModeChoice";
import type { TopLevelTag } from "../../src/cloud/labelColoring";
import { LegendSheet } from "../../src/cloud/LegendSheet";
import { M } from "../../src/messages/messageIds";
import { useCurationAccess } from "../../src/samples/useCurationAccess";

const EMPTY_CAPTION = M.cloud.empty.body;

const TAGS: readonly TopLevelTag[] = [
    { name: "SNARE", sampleCount: 21, rank: 0 },
    { name: "PIANO", sampleCount: 12, rank: 2 },
];

interface SheetOverrides {
    readonly tags?: readonly TopLevelTag[];
    readonly onModeChange?: (mode: ColoringMode) => void;
    readonly onToggle?: (name: string) => void;
}

function renderSheet(overrides: SheetOverrides = {}): void {
    render(
        <LegendSheet
            mode="category"
            onModeChange={overrides.onModeChange ?? vi.fn()}
            tags={overrides.tags ?? TAGS}
            painted={["SNARE"]}
            onToggle={overrides.onToggle ?? vi.fn()}
            emptyCaption={EMPTY_CAPTION}
            onClose={vi.fn()}
        />,
    );
}

describe("LegendSheet", () => {
    it("offers the choice of what paints the points above the chips", () => {
        const onModeChange = vi.fn();
        renderSheet({ onModeChange });

        const choice = screen.getByRole("group", { name: M.cloud.legend.colorBy });
        expect(within(choice).getByRole("button", { name: M.cloud.coloring.category })).toHaveAttribute(
            "aria-pressed",
            "true",
        );
        fireEvent.click(within(choice).getByRole("button", { name: M.cloud.coloring.labels }));

        expect(onModeChange).toHaveBeenCalledWith("label");
        expect(screen.getByRole("dialog", { name: M.cloud.legend.title })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /SNARE/ })).toHaveAttribute("aria-pressed", "true");
    });

    it("paints by category alone, offering no choice, where no one's labels are shown", () => {
        vi.mocked(useCurationAccess).mockReturnValue({ curationShown: false, labelEditing: false });
        renderSheet();

        expect(screen.queryByRole("group", { name: M.cloud.legend.colorBy })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: M.cloud.coloring.labels })).not.toBeInTheDocument();
    });

    it("says so while the chosen mode has no tag yet", () => {
        renderSheet({ tags: [] });

        expect(screen.getByText(EMPTY_CAPTION)).toBeInTheDocument();
        expect(screen.queryByRole("group", { name: M.cloud.legend.tagsShown })).not.toBeInTheDocument();
    });

    it("reports the tag a person toggles", () => {
        const onToggle = vi.fn();
        renderSheet({ onToggle });

        fireEvent.click(screen.getByRole("button", { name: /PIANO/ }));

        expect(onToggle).toHaveBeenCalledWith("PIANO");
    });
});
