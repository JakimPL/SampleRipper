import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CLOSING_FALLBACK_MS, Collapsible } from "../../../src/shared/motion/Collapsible";
import { REDUCED_MOTION_QUERY } from "../../../src/shared/motion/reducedMotion";
import { stubMatchMedia } from "../../support/matchMedia";

const CONTENT = "Section content";

function section(open: boolean): ReactElement {
    return (
        <Collapsible open={open}>
            <p>
                {CONTENT} <button type="button">Inside</button>
            </p>
        </Collapsible>
    );
}

function wrapper(): HTMLElement | null {
    return document.querySelector(".collapsible");
}

function requireWrapper(): HTMLElement {
    const element = wrapper();
    if (element === null) {
        throw new Error("the section is not mounted");
    }
    return element;
}

afterEach(() => {
    vi.useRealTimers();
});

describe("Collapsible", () => {
    it("shows a section open from its first render at once", () => {
        render(section(true));

        expect(screen.getByRole("button", { name: "Inside" })).toBeInTheDocument();
        expect(requireWrapper()).not.toHaveClass("is-collapsed");
    });

    it("mounts nothing while closed from its first render", () => {
        render(section(false));

        expect(wrapper()).not.toBeInTheDocument();
    });

    it("opens a closed section to its open style", () => {
        const { rerender } = render(section(false));

        rerender(section(true));

        expect(requireWrapper()).not.toHaveClass("is-collapsed");
        expect(requireWrapper()).not.toHaveAttribute("aria-hidden");
        expect(screen.getByRole("button", { name: "Inside" })).toBeInTheDocument();
    });

    it("keeps a closing section mounted, inert and hidden, until its own transition ends", () => {
        const { rerender } = render(section(true));

        rerender(section(false));

        const closing = requireWrapper();
        expect(closing).toHaveClass("is-collapsed");
        expect(closing).toHaveAttribute("aria-hidden", "true");
        expect(closing).toHaveAttribute("inert");
        expect(screen.queryByRole("button", { name: "Inside" })).not.toBeInTheDocument();

        fireEvent.transitionEnd(screen.getByText(CONTENT, { exact: false }));
        expect(wrapper()).toBe(closing);

        fireEvent.transitionEnd(closing);
        expect(wrapper()).not.toBeInTheDocument();
    });

    it("ends a closing whose transition raises no end once the fallback has passed", () => {
        const { rerender } = render(section(true));
        vi.useFakeTimers();

        rerender(section(false));
        act(() => {
            vi.advanceTimersByTime(CLOSING_FALLBACK_MS - 1);
        });
        expect(wrapper()).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(wrapper()).not.toBeInTheDocument();
    });

    it("turns a closing section back open where it stands", () => {
        const { rerender } = render(section(true));
        rerender(section(false));
        const closing = requireWrapper();

        rerender(section(true));
        fireEvent.transitionEnd(closing);

        expect(wrapper()).toBe(closing);
        expect(closing).not.toHaveClass("is-collapsed");
        expect(closing).not.toHaveAttribute("aria-hidden");
    });

    it("closes at once under reduced motion", () => {
        stubMatchMedia(new Set([REDUCED_MOTION_QUERY]));
        const { rerender } = render(section(true));

        rerender(section(false));

        expect(wrapper()).not.toBeInTheDocument();
    });
});
