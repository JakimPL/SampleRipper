import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { M } from "../../src/messages/messageIds";
import { TopBar } from "../../src/shell/TopBar";

describe("TopBar", () => {
    it("names the application as the way home, and offers the View and Help menus and the theme", () => {
        render(
            <MemoryRouter>
                <TopBar api={null} />
            </MemoryRouter>,
        );

        expect(screen.getByRole("link", { name: "SampleRipper" })).toHaveAttribute("href", "/");
        expect(screen.getByText(M.shell.menus.view)).toBeInTheDocument();
        expect(screen.getByText(M.shell.menus.help)).toBeInTheDocument();
        expect(screen.getByLabelText(M.theme.menu)).toBeInTheDocument();
    });
});
