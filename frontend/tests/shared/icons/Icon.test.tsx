import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Icon } from "../../../src/shared/icons/Icon";
import { ICON_SHAPES, type IconName } from "../../../src/shared/icons/iconPaths";

/** One icon drawn: its name, and the fill its outline encloses. */
interface PaintCase {
    readonly name: IconName;
    readonly fill: string;
}

const PAINT_CASES: readonly PaintCase[] = [
    { name: "play", fill: "currentColor" },
    { name: "cloud", fill: "none" },
];

describe("Icon", () => {
    it("draws the named path as an image with its label", () => {
        render(<Icon name="cloud" label="Cloud" />);

        const icon = screen.getByRole("img", { name: "Cloud" });
        expect(icon.querySelector("path")).toHaveAttribute("d", ICON_SHAPES.cloud.path);
    });

    it.each(PAINT_CASES)("outlines $name in the text's color, filled with $fill", ({ name, fill }: PaintCase) => {
        const { container } = render(<Icon name={name} label={null} />);

        const icon = container.querySelector("svg");
        expect(icon).toHaveAttribute("stroke", "currentColor");
        expect(icon).toHaveAttribute("stroke-linejoin", "round");
        expect(icon).toHaveAttribute("fill", fill);
    });

    it("hides a decorative icon from assistive technology", () => {
        const { container } = render(<Icon name="stats" label={null} />);

        expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
        expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
});
