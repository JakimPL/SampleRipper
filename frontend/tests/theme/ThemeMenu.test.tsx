import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { M } from "../../src/messages/messageIds";
import { ThemeMenu } from "../../src/theme/ThemeMenu";
import { useThemeStore } from "../../src/theme/themeStore";

describe("ThemeMenu", () => {
    it("lists every theme option, including OpenMPT", () => {
        render(<ThemeMenu />);

        const options = screen.getByLabelText(M.theme.menu).querySelectorAll("option");
        expect(Array.from(options).map((option) => option.textContent)).toEqual([
            M.theme.system,
            M.theme.light,
            M.theme.dark,
            M.theme.openmpt,
        ]);
    });

    it("reflects the store's current preference", () => {
        useThemeStore.getState().setPreference("dark");

        render(<ThemeMenu />);

        expect(screen.getByLabelText<HTMLSelectElement>(M.theme.menu).value).toBe("dark");
    });

    it("switches the theme preference on selection", () => {
        render(<ThemeMenu />);

        fireEvent.change(screen.getByLabelText(M.theme.menu), { target: { value: "openmpt" } });

        expect(useThemeStore.getState().preference).toBe("openmpt");
    });
});
