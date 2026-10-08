import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { M } from "../../src/messages/messageIds";
import { HelpMenu } from "../../src/shell/HelpMenu";

function openMenu(): void {
    render(<HelpMenu />);
    fireEvent.click(screen.getByText(M.shell.menus.help));
}

describe("HelpMenu", () => {
    it("opens the guide to the keys and clicks", () => {
        openMenu();

        fireEvent.click(screen.getByRole("button", { name: M.shell.guide.titles.pointer }));

        const guide = screen.getByRole("dialog", { name: M.shell.guide.titles.pointer });
        expect(within(guide).getAllByRole("term").length).toBeGreaterThan(0);
    });

    it("opens the diagnostics", () => {
        openMenu();

        fireEvent.click(screen.getByRole("button", { name: M.shell.diagnostics.title }));

        expect(screen.getByRole("dialog", { name: M.shell.diagnostics.title })).toBeInTheDocument();
        expect(screen.getByRole("radio", { name: M.shell.diagnostics.dotsPlain })).toBeInTheDocument();
    });

    it("opens About", () => {
        openMenu();

        fireEvent.click(screen.getByRole("button", { name: M.shell.about.title }));

        expect(screen.getByRole("dialog", { name: M.shell.about.title })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: M.shell.about.source })).toBeInTheDocument();
    });
});
