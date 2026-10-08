import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { M } from "../../../src/messages/messageIds";
import { useMorphStore } from "../../../src/morph/morphStore";
import { tabPanels } from "../../../src/shell/phone/phoneView";
import { pairStateOf, TabBar } from "../../../src/shell/phone/TabBar";

const TABS = tabPanels();

describe("pairStateOf", () => {
    it("reads how far the pair has come", () => {
        expect(pairStateOf(null, null)).toBe("none");
        expect(pairStateOf("a", null)).toBe("half");
        expect(pairStateOf(null, "b")).toBe("half");
        expect(pairStateOf("a", "b")).toBe("full");
    });
});

describe("TabBar", () => {
    it("offers every tab in order and marks the one in front", () => {
        render(
            <MemoryRouter>
                <TabBar tabs={TABS} activeTabId="cloud" />
            </MemoryRouter>,
        );

        const links = screen.getAllByRole("link");
        expect(links.map((link) => link.textContent)).toEqual([
            M.workspace.panels.samples,
            M.workspace.panels.cloud,
            M.workspace.panels.modules,
        ]);
        expect(links.map((link) => link.getAttribute("href"))).toEqual(["/", "/cloud", "/modules"]);
        expect(screen.getByRole("link", { name: M.workspace.panels.cloud })).toHaveAttribute("aria-current", "page");
        expect(screen.getByRole("link", { name: M.workspace.panels.samples })).not.toHaveAttribute("aria-current");
    });

    it("replaces the address rather than adding to the history", async () => {
        const router = createMemoryRouter([{ path: "*", element: <TabBar tabs={TABS} activeTabId="samples-list" /> }], {
            initialEntries: ["/"],
        });
        render(<RouterProvider router={router} />);

        fireEvent.click(screen.getByRole("link", { name: M.workspace.panels.modules }));

        await waitFor(() => {
            expect(router.state.location.pathname).toBe("/modules");
        });
        expect(router.state.historyAction).toBe("REPLACE");
    });

    it("dots the Cloud tab as the pair is built", () => {
        render(
            <MemoryRouter>
                <TabBar tabs={TABS} activeTabId="samples-list" />
            </MemoryRouter>,
        );
        expect(screen.queryByTestId("morph-pair-dot")).not.toBeInTheDocument();

        act(() => {
            useMorphStore.getState().setEnd("first", "a");
        });
        expect(screen.getByTestId("morph-pair-dot")).toHaveClass("is-half");

        act(() => {
            useMorphStore.getState().setEnd("second", "b");
        });
        expect(screen.getByTestId("morph-pair-dot")).not.toHaveClass("is-half");
        expect(screen.getByRole("link", { name: M.workspace.panels.cloud })).toContainElement(
            screen.getByTestId("morph-pair-dot"),
        );
    });

    it("hides the dot while the morph is off, and shows it back as it turns on", () => {
        useMorphStore.getState().setEnd("first", "a");
        render(
            <MemoryRouter>
                <TabBar tabs={TABS} activeTabId="samples-list" />
            </MemoryRouter>,
        );

        act(() => {
            useMorphStore.getState().setEnabled(false);
        });
        expect(screen.queryByTestId("morph-pair-dot")).not.toBeInTheDocument();

        act(() => {
            useMorphStore.getState().setEnabled(true);
        });
        expect(screen.getByTestId("morph-pair-dot")).toHaveClass("is-half");
    });
});
