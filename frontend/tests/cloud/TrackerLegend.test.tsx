import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { trackerColorProperty } from "../../src/cloud/cloudRenderSettings";
import type { TrackerCount } from "../../src/cloud/trackerColoring";
import { TrackerLegend } from "../../src/cloud/TrackerLegend";

const COUNTS: readonly TrackerCount[] = [
    { format: "xm", moduleCount: 40 },
    { format: "s3m", moduleCount: 7 },
];

describe("TrackerLegend", () => {
    it("lists each format with its module count in the order given, pressed while painted", () => {
        render(<TrackerLegend counts={COUNTS} painted={["xm"]} onToggle={vi.fn()} />);

        const chips = within(screen.getByRole("group", { name: "Formats shown" })).getAllByRole("button");
        expect(chips.map((chip) => chip.textContent)).toEqual(["XM40", "S3M7"]);
        expect(chips.map((chip) => chip.getAttribute("aria-pressed"))).toEqual(["true", "false"]);
    });

    it("draws each swatch in its format's stamp color", () => {
        render(<TrackerLegend counts={COUNTS} painted={["xm", "s3m"]} onToggle={vi.fn()} />);

        const swatch = screen.getByRole("button", { name: /S3M/ }).querySelector<HTMLElement>(".tag-legend-swatch");
        expect(swatch?.style.background).toBe(`var(${trackerColorProperty("s3m")})`);
    });

    it("reports the format a person toggles", async () => {
        const onToggle = vi.fn();
        render(<TrackerLegend counts={COUNTS} painted={["xm", "s3m"]} onToggle={onToggle} />);

        await userEvent.click(screen.getByRole("button", { name: /S3M/ }));

        expect(onToggle).toHaveBeenCalledWith("s3m");
    });
});
