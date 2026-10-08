import type { ChangeEvent, ReactElement } from "react";

import { M } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { isThemePreference, THEME_OPTIONS } from "./themeOptions";
import { useThemeStore } from "./themeStore";

/** Top bar control for switching the shell's visual theme, beside the menus. */
export function ThemeMenu(): ReactElement {
    const { text } = useMessages();
    const preference = useThemeStore((state) => state.preference);
    const setPreference = useThemeStore((state) => state.setPreference);

    function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
        const { value } = event.target;
        if (isThemePreference(value)) {
            setPreference(value);
        }
    }

    return (
        <select className="theme-menu field" aria-label={text(M.theme.menu)} value={preference} onChange={handleChange}>
            {THEME_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                    {text(option.label)}
                </option>
            ))}
        </select>
    );
}
