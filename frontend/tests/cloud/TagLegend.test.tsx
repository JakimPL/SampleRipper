import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { TopLevelTag } from "../../src/cloud/labelColoring";
import { TagLegend } from "../../src/cloud/TagLegend";
import { M } from "../../src/messages/messageIds";
import { keyed } from "../support/keyedMessages";

const EMPTY_CAPTION = M.cloud.empty.body;

const TAGS: readonly TopLevelTag[] = [
    { name: "LO-FI", sampleCount: 33, rank: 4 },
    { name: "SNARE", sampleCount: 21, rank: 0 },
    { name: "PIANO", sampleCount: 12, rank: 2 },
];

describe("TagLegend", () => {
    it("lists the painted tags with their counts, and every tag once expanded", async () => {
        render(<TagLegend tags={TAGS} painted={["SNARE"]} onToggle={vi.fn()} emptyCaption={EMPTY_CAPTION} />);

        const snare = screen.getByRole("button", { name: /SNARE/ });
        expect(snare).toHaveAttribute("aria-pressed", "true");
        expect(snare).toHaveTextContent("21");
        expect(screen.queryByRole("button", { name: /LO-FI/ })).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: keyed(M.cloud.legend.hiddenMore, { count: 2 }) }));

        const lofi = screen.getByRole("button", { name: /LO-FI/ });
        expect(lofi).toHaveAttribute("aria-pressed", "false");
        expect(lofi).toHaveTextContent("33");
        expect(screen.getByRole("button", { name: /PIANO/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: M.cloud.legend.shownOnly })).toHaveAttribute("aria-expanded", "true");
    });

    it("drops every tag, in one order, into the panel over the cloud once expanded", async () => {
        const { container } = render(
            <TagLegend tags={TAGS} painted={["SNARE"]} onToggle={vi.fn()} emptyCaption={EMPTY_CAPTION} />,
        );

        await userEvent.click(screen.getByRole("button", { name: keyed(M.cloud.legend.hiddenMore, { count: 2 }) }));

        const overlay = container.querySelector<HTMLElement>(".tag-legend-overlay");
        if (overlay === null) {
            throw new Error("the expanded legend drops no panel");
        }
        const listed = within(overlay).getAllByRole("button");
        expect(listed.map((button) => button.textContent)).toEqual(["LO-FI33", "SNARE21", "PIANO12"]);
    });

    it("takes the panel away on Escape", async () => {
        render(<TagLegend tags={TAGS} painted={["SNARE"]} onToggle={vi.fn()} emptyCaption={EMPTY_CAPTION} />);
        await userEvent.click(screen.getByRole("button", { name: keyed(M.cloud.legend.hiddenMore, { count: 2 }) }));

        await userEvent.keyboard("{Escape}");

        expect(screen.queryByRole("button", { name: /LO-FI/ })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: keyed(M.cloud.legend.hiddenMore, { count: 2 }) })).toHaveAttribute(
            "aria-expanded",
            "false",
        );
    });

    it("takes the panel away on a press outside the legend, and keeps it through a press on a chip", async () => {
        render(
            <>
                <TagLegend tags={TAGS} painted={["SNARE"]} onToggle={vi.fn()} emptyCaption={EMPTY_CAPTION} />
                <p>elsewhere</p>
            </>,
        );
        await userEvent.click(screen.getByRole("button", { name: keyed(M.cloud.legend.hiddenMore, { count: 2 }) }));

        fireEvent.pointerDown(screen.getByRole("button", { name: /PIANO/ }));
        expect(screen.getByRole("button", { name: /PIANO/ })).toBeInTheDocument();
        fireEvent.pointerDown(screen.getByText("elsewhere"));

        expect(screen.queryByRole("button", { name: /PIANO/ })).not.toBeInTheDocument();
    });

    it("keeps the way back while expanded, once every tag is painted", async () => {
        const { rerender } = render(
            <TagLegend tags={TAGS} painted={["SNARE"]} onToggle={vi.fn()} emptyCaption={EMPTY_CAPTION} />,
        );
        await userEvent.click(screen.getByRole("button", { name: keyed(M.cloud.legend.hiddenMore, { count: 2 }) }));

        rerender(
            <TagLegend
                tags={TAGS}
                painted={["LO-FI", "SNARE", "PIANO"]}
                onToggle={vi.fn()}
                emptyCaption={EMPTY_CAPTION}
            />,
        );

        expect(screen.getByRole("button", { name: M.cloud.legend.shownOnly })).toHaveAttribute("aria-expanded", "true");
    });

    it("collapses back to the painted tags", async () => {
        render(<TagLegend tags={TAGS} painted={["SNARE"]} onToggle={vi.fn()} emptyCaption={EMPTY_CAPTION} />);
        await userEvent.click(screen.getByRole("button", { name: keyed(M.cloud.legend.hiddenMore, { count: 2 }) }));

        await userEvent.click(screen.getByRole("button", { name: M.cloud.legend.shownOnly }));

        expect(screen.queryByRole("button", { name: /LO-FI/ })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: keyed(M.cloud.legend.hiddenMore, { count: 2 }) })).toHaveAttribute(
            "aria-expanded",
            "false",
        );
    });

    it("offers the toggle only while some tags are hidden", () => {
        render(
            <TagLegend
                tags={TAGS}
                painted={["LO-FI", "SNARE", "PIANO"]}
                onToggle={vi.fn()}
                emptyCaption={EMPTY_CAPTION}
            />,
        );

        expect(
            screen.queryByRole("button", { name: (name) => name.startsWith(M.cloud.legend.hiddenMore) }),
        ).not.toBeInTheDocument();
        expect(screen.getAllByRole("button")).toHaveLength(TAGS.length);
    });

    it("reports the tag a person toggles, whether painted or revealed", async () => {
        const onToggle = vi.fn();
        render(<TagLegend tags={TAGS} painted={["SNARE"]} onToggle={onToggle} emptyCaption={EMPTY_CAPTION} />);

        await userEvent.click(screen.getByRole("button", { name: /SNARE/ }));
        await userEvent.click(screen.getByRole("button", { name: keyed(M.cloud.legend.hiddenMore, { count: 2 }) }));
        await userEvent.click(screen.getByRole("button", { name: /LO-FI/ }));

        expect(onToggle).toHaveBeenNthCalledWith(1, "SNARE");
        expect(onToggle).toHaveBeenNthCalledWith(2, "LO-FI");
    });

    it("says so when nothing is labeled yet", () => {
        render(<TagLegend tags={[]} painted={[]} onToggle={vi.fn()} emptyCaption={EMPTY_CAPTION} />);

        expect(screen.getByText(EMPTY_CAPTION)).toBeInTheDocument();
    });
});
