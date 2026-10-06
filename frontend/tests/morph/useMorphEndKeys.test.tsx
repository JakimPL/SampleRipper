import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { type MorphEnd, useMorphStore } from "../../src/morph/morphStore";
import { endKeyChoice, useMorphEndKeys } from "../../src/morph/useMorphEndKeys";

function keyDown(key: string, modifiers: Partial<KeyboardEventInit> = {}): KeyboardEvent {
    return new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...modifiers });
}

/** A key pressed on `target`, as the browser dispatches it to the element holding the focus. */
function keyDownOn(target: EventTarget, key: string, modifiers: Partial<KeyboardEventInit> = {}): KeyboardEvent {
    const event = keyDown(key, modifiers);
    target.dispatchEvent(event);
    return event;
}

function element(markup: string): Element {
    const holder = document.createElement("div");
    holder.innerHTML = markup;
    const first = holder.firstElementChild;
    if (first === null) {
        throw new Error(`No element in ${markup}`);
    }
    return first;
}

/** One key on one target, and the end it selects with the first end selected. */
interface ChoiceCase {
    readonly name: string;
    readonly key: string;
    readonly modifiers: Partial<KeyboardEventInit>;
    readonly target: () => Element;
    readonly pointerUsed: boolean;
    readonly end: MorphEnd | null;
}

const CHOICE_CASES: readonly ChoiceCase[] = [
    {
        name: "A selects the first end",
        key: "a",
        modifiers: {},
        target: () => document.body,
        pointerUsed: false,
        end: "first",
    },
    {
        name: "B selects the second end, read as a capital too",
        key: "B",
        modifiers: { shiftKey: true },
        target: () => document.body,
        pointerUsed: false,
        end: "second",
    },
    {
        name: "B on a button selects the second end",
        key: "b",
        modifiers: {},
        target: () => element("<button>Play</button>"),
        pointerUsed: true,
        end: "second",
    },
    {
        name: "B in a text field is typed",
        key: "b",
        modifiers: {},
        target: () => element('<input type="text">'),
        pointerUsed: true,
        end: null,
    },
    {
        name: "B in a drop-down list picks an option",
        key: "b",
        modifiers: {},
        target: () => element("<select><option>Bass</option></select>"),
        pointerUsed: true,
        end: null,
    },
    {
        name: "Ctrl+B stays the browser's",
        key: "b",
        modifiers: { ctrlKey: true },
        target: () => document.body,
        pointerUsed: true,
        end: null,
    },
    {
        name: "another letter selects nothing",
        key: "c",
        modifiers: {},
        target: () => document.body,
        pointerUsed: true,
        end: null,
    },
    {
        name: "Tab switches the end with the focus outside the controls after a pointer",
        key: "Tab",
        modifiers: {},
        target: () => document.body,
        pointerUsed: true,
        end: "second",
    },
    {
        name: "Tab switches the end from a box focused from code alone",
        key: "Tab",
        modifiers: {},
        target: () => element('<div tabindex="-1"></div>'),
        pointerUsed: true,
        end: "second",
    },
    {
        name: "Tab moves the focus for a person on the keyboard alone",
        key: "Tab",
        modifiers: {},
        target: () => document.body,
        pointerUsed: false,
        end: null,
    },
    {
        name: "Tab moves the focus on from a button",
        key: "Tab",
        modifiers: {},
        target: () => element("<button>Play</button>"),
        pointerUsed: true,
        end: null,
    },
    {
        name: "Tab moves the focus on from a link",
        key: "Tab",
        modifiers: {},
        target: () => element('<a href="/samples">Samples</a>'),
        pointerUsed: true,
        end: null,
    },
    {
        name: "Shift+Tab always moves the focus",
        key: "Tab",
        modifiers: { shiftKey: true },
        target: () => document.body,
        pointerUsed: true,
        end: null,
    },
];

describe("endKeyChoice", () => {
    it.each(CHOICE_CASES)("$name", ({ key, modifiers, target, pointerUsed, end }: ChoiceCase) => {
        const event = keyDown(key, modifiers);
        Object.defineProperty(event, "target", { value: target() });

        expect(endKeyChoice(event, "first", pointerUsed)).toBe(end);
    });
});

function EndKeys(): ReactElement {
    useMorphEndKeys();
    return (
        <>
            <button type="button">Play</button>
            <input type="text" aria-label="Filter" />
        </>
    );
}

describe("useMorphEndKeys", () => {
    it("selects the end its letter names, taking the key for itself", () => {
        render(<EndKeys />);

        const pressed = keyDownOn(document.body, "b");

        expect(useMorphStore.getState().selectedEnd).toBe("second");
        expect(pressed.defaultPrevented).toBe(true);
    });

    it("leaves a letter typed into a text field to the field", () => {
        render(<EndKeys />);

        const typed = keyDownOn(screen.getByRole("textbox", { name: "Filter" }), "b");

        expect(useMorphStore.getState().selectedEnd).toBe("first");
        expect(typed.defaultPrevented).toBe(false);
    });

    it("switches the end on Tab once a pointer has been used, and back on the next", () => {
        render(<EndKeys />);
        fireEvent.pointerDown(document.body);

        const switching = keyDownOn(document.body, "Tab");
        expect(useMorphStore.getState().selectedEnd).toBe("second");
        expect(switching.defaultPrevented).toBe(true);

        keyDownOn(document.body, "Tab");
        expect(useMorphStore.getState().selectedEnd).toBe("first");
    });

    it("leaves Tab to the focus before any pointer is used", () => {
        render(<EndKeys />);

        const moving = keyDownOn(document.body, "Tab");

        expect(useMorphStore.getState().selectedEnd).toBe("first");
        expect(moving.defaultPrevented).toBe(false);
    });

    it("leaves Tab to the focus while a control holds it", () => {
        render(<EndKeys />);
        fireEvent.pointerDown(document.body);

        const moving = keyDownOn(screen.getByRole("button", { name: "Play" }), "Tab");

        expect(useMorphStore.getState().selectedEnd).toBe("first");
        expect(moving.defaultPrevented).toBe(false);
    });

    it("selects nothing while the morph is off", () => {
        useMorphStore.getState().setEnabled(false);
        render(<EndKeys />);
        fireEvent.pointerDown(document.body);

        const pressed = keyDownOn(document.body, "b");
        keyDownOn(document.body, "Tab");

        expect(useMorphStore.getState().selectedEnd).toBe("first");
        expect(pressed.defaultPrevented).toBe(false);
    });
});
