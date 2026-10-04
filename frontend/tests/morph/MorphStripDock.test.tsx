import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type * as MorphApi from "../../src/api/morph";
import { useMorphStore } from "../../src/morph/morphStore";
import { MorphStripDock } from "../../src/morph/MorphStripDock";
import { installControllableResizeObserver, resizeTo } from "../support/resizeObserver";

const { getMorphStatus } = vi.hoisted(() => ({
    getMorphStatus: vi.fn().mockResolvedValue({ available: true, service: null }),
}));

vi.mock("../../src/api/morph", async () => {
    const actual = await vi.importActual<typeof MorphApi>("../../src/api/morph");
    return { ...actual, getMorphStatus };
});

const DOCK_WIDTH_PX = 600;
const ROW_HEIGHT_PX = 48;
const OPENED_HEIGHT_PX = 230;

function dock(): Element {
    const element = document.querySelector(".morph-strip-dock");
    if (element === null) {
        throw new Error("the dock is not mounted");
    }
    return element;
}

describe("MorphStripDock", () => {
    it("reports the height it covers as it changes, and none once it leaves", () => {
        installControllableResizeObserver();
        const onHeightChange = vi.fn();
        const { unmount } = render(<MorphStripDock onHeightChange={onHeightChange} />);

        act(() => {
            resizeTo(dock(), DOCK_WIDTH_PX, ROW_HEIGHT_PX);
            resizeTo(dock(), DOCK_WIDTH_PX, ROW_HEIGHT_PX);
            resizeTo(dock(), DOCK_WIDTH_PX, OPENED_HEIGHT_PX);
        });
        expect(onHeightChange.mock.calls).toEqual([[ROW_HEIGHT_PX], [OPENED_HEIGHT_PX]]);

        unmount();
        expect(onHeightChange).toHaveBeenLastCalledWith(0);
    });

    it("slides the strip away as the morph turns off, and back as it turns on", () => {
        render(<MorphStripDock onHeightChange={vi.fn()} />);
        expect(screen.getByRole("region", { name: "Morph" })).toBeInTheDocument();

        act(() => {
            useMorphStore.getState().setEnabled(false);
        });
        const sliding = dock().firstElementChild;
        expect(sliding).toHaveClass("is-collapsed");
        expect(screen.queryByRole("region", { name: "Morph" })).not.toBeInTheDocument();

        if (sliding !== null) {
            fireEvent.transitionEnd(sliding);
        }
        expect(dock()).toBeEmptyDOMElement();

        act(() => {
            useMorphStore.getState().setEnabled(true);
        });
        expect(screen.getByRole("region", { name: "Morph" })).toBeInTheDocument();
    });
});
