import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type * as CurationApi from "../../src/api/curation";
import { M } from "../../src/messages/messageIds";
import { LabelSheet } from "../../src/samples/LabelSheet";

const { getLabelVocabulary } = vi.hoisted(() => ({ getLabelVocabulary: vi.fn() }));

vi.mock("../../src/api/curation", async () => {
    const actual = await vi.importActual<typeof CurationApi>("../../src/api/curation");
    return { ...actual, getLabelVocabulary };
});

describe("LabelSheet", () => {
    it("offers the known wordings that contain what was typed, and takes one as the text", async () => {
        getLabelVocabulary.mockResolvedValue(["KICK", "HI-HAT: CLOSED", "HI-HAT: OPEN"]);
        render(<LabelSheet label={null} onCommit={vi.fn()} onClose={vi.fn()} />);
        expect(await screen.findByRole("button", { name: "KICK" })).toBeInTheDocument();

        await userEvent.type(screen.getByLabelText(M.samples.label.handLabel), "hi-hat");
        expect(screen.queryByRole("button", { name: "KICK" })).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "HI-HAT: OPEN" }));

        expect(screen.getByLabelText(M.samples.label.handLabel)).toHaveValue("HI-HAT: OPEN");
    });

    it("records the wording on Done and on Enter, trimmed, and closes", async () => {
        getLabelVocabulary.mockResolvedValue([]);
        const onCommit = vi.fn();
        const onClose = vi.fn();
        render(<LabelSheet label={null} onCommit={onCommit} onClose={onClose} />);

        await userEvent.type(screen.getByLabelText(M.samples.label.handLabel), " snare {Enter}");

        expect(onCommit).toHaveBeenCalledWith("snare");
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("takes the label back on Clear, and records nothing when the wording stands", () => {
        getLabelVocabulary.mockResolvedValue([]);
        const onCommit = vi.fn();
        const onClose = vi.fn();
        const { rerender } = render(<LabelSheet label="KICK" onCommit={onCommit} onClose={onClose} />);

        fireEvent.click(screen.getByRole("button", { name: M.samples.label.done }));
        expect(onCommit).not.toHaveBeenCalled();
        expect(onClose).toHaveBeenCalledTimes(1);

        rerender(<LabelSheet label="KICK" onCommit={onCommit} onClose={onClose} />);
        fireEvent.click(screen.getByRole("button", { name: M.samples.label.clear }));

        expect(onCommit).toHaveBeenCalledWith(null);
    });
});
