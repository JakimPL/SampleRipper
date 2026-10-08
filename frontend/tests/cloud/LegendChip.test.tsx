import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LegendChip } from "../../src/cloud/LegendChip";

describe("LegendChip", () => {
    it("names its entry with the count, pressed while painted, its swatch in the given color", () => {
        render(<LegendChip name="SNARE" count={21} color="#123456" painted onToggle={vi.fn()} />);

        const chip = screen.getByRole("button", { name: "SNARE 21" });
        expect(chip).toHaveAttribute("aria-pressed", "true");
        expect(chip.querySelector<HTMLElement>(".tag-legend-swatch")?.style.background).toBe("rgb(18, 52, 86)");
    });

    it("reports a press", async () => {
        const onToggle = vi.fn();
        render(<LegendChip name="SNARE" count={21} color="#123456" painted={false} onToggle={onToggle} />);

        await userEvent.click(screen.getByRole("button", { name: "SNARE 21" }));

        expect(onToggle).toHaveBeenCalledTimes(1);
    });
});
