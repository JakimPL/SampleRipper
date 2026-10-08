import { M, type MessageId } from "../messages/messageIds";

export type ThemePreference = "system" | "light" | "dark" | "openmpt";

export interface ThemeOption {
    readonly id: ThemePreference;
    readonly label: MessageId;
}

/**
 * Every theme preference the picker offers, in display order. "System" defers to the operating
 * system's own light/dark preference instead of setting `data-theme` on the document at all.
 */
export const THEME_OPTIONS: readonly ThemeOption[] = [
    { id: "system", label: M.theme.system },
    { id: "light", label: M.theme.light },
    { id: "dark", label: M.theme.dark },
    { id: "openmpt", label: M.theme.openmpt },
];

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";

export function isThemePreference(value: string): value is ThemePreference {
    return THEME_OPTIONS.some((option) => option.id === value);
}
