import { useEffect } from "react";

import { type MorphEnd, OTHER_END, useMorphStore } from "./morphStore";
import { editsText } from "./useMorphUndoKeys";

const END_KEYS: Readonly<Record<string, MorphEnd>> = { a: "first", b: "second" };
const SWITCH_KEY = "Tab";
/** The elements Tab walks through, which keep the key for moving the focus. */
const CONTROL_SELECTOR = [
    "a[href]",
    "button",
    "input",
    "select",
    "textarea",
    "summary",
    "iframe",
    "[contenteditable]:not([contenteditable='false'])",
    "[tabindex]:not([tabindex='-1'])",
].join(", ");

/** Whether the focus rests on a control, where Tab goes on moving it. */
function holdsControl(target: EventTarget | null): boolean {
    return target instanceof Element && target.matches(CONTROL_SELECTOR);
}

/**
 * The end a key selects: A the first and B the second, read by the letter typed, outside a text
 * field and a drop-down list, whose typing picks an option; and Tab the end opposite `selectedEnd`,
 * while the focus rests outside the controls after a pointer has been used. A chord with Ctrl, Alt
 * or ⌘ stays the browser's, and Shift+Tab always moves the focus.
 */
export function endKeyChoice(event: KeyboardEvent, selectedEnd: MorphEnd, pointerUsed: boolean): MorphEnd | null {
    if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) {
        return null;
    }
    if (event.key === SWITCH_KEY) {
        return event.shiftKey || !pointerUsed || holdsControl(event.target) ? null : OTHER_END[selectedEnd];
    }
    if (editsText(event.target) || event.target instanceof HTMLSelectElement) {
        return null;
    }
    return END_KEYS[event.key.toLowerCase()] ?? null;
}

/**
 * A and B select the morph's ends from anywhere in the app while the morph is on, and Tab switches
 * between them. Tab keeps moving the focus for a person on the keyboard alone, and wherever a
 * control holds the focus, so it switches the ends once a click has left the focus outside them.
 */
export function useMorphEndKeys(): void {
    useEffect(() => {
        let pointerUsed = false;

        function handlePointerDown(): void {
            pointerUsed = true;
        }

        function handleKeyDown(event: KeyboardEvent): void {
            const { enabled, selectedEnd, selectEnd } = useMorphStore.getState();
            if (!enabled) {
                return;
            }
            const end = endKeyChoice(event, selectedEnd, pointerUsed);
            if (end === null) {
                return;
            }
            event.preventDefault();
            selectEnd(end);
        }

        window.addEventListener("pointerdown", handlePointerDown, true);
        window.addEventListener("keydown", handleKeyDown);
        return (): void => {
            window.removeEventListener("pointerdown", handlePointerDown, true);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);
}
