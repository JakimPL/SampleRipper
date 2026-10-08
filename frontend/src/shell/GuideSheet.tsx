import type { ReactElement } from "react";

import type { InputMode } from "../layout/layoutMode";
import { useCurationAccess } from "../samples/useCurationAccess";
import { BottomSheet } from "../shared/overlay/BottomSheet";

interface GuideEntry {
    readonly gesture: string;
    readonly meaning: string;
    /** Shown only where the person here may change labels (true), or only where they may not (false). */
    readonly whenEditing?: boolean;
}

interface GuideSection {
    readonly title: string;
    readonly entries: readonly GuideEntry[];
}

const TOUCH_GUIDE: readonly GuideSection[] = [
    {
        title: "Lists",
        entries: [
            { gesture: "Tap a row", meaning: "selects the sample and plays it" },
            { gesture: "Hold a row", meaning: "opens its stars, heart and label", whenEditing: true },
            { gesture: "Hold a row", meaning: "opens its actions", whenEditing: false },
            { gesture: "Tap ›", meaning: "opens the sample or module as a page" },
            { gesture: "Tap the heart", meaning: "marks the sample as a favorite", whenEditing: true },
        ],
    },
    {
        title: "The tray",
        entries: [
            { gesture: "Tap the waveform", meaning: "plays or pauses the selected sample" },
            {
                gesture: "Tap a star or the heart",
                meaning: "rates the selected sample, or marks it as a favorite",
                whenEditing: true,
            },
            { gesture: "Double-tap the name", meaning: "opens the sample or module as a page, as › does" },
        ],
    },
    {
        title: "A page",
        entries: [
            { gesture: "Tap ‹ or ›", meaning: "moves through the list one sample at a time" },
            { gesture: "Tap ←", meaning: "returns to the list" },
        ],
    },
    {
        title: "The cloud",
        entries: [
            { gesture: "Tap a point", meaning: "selects it and plays it" },
            { gesture: "Double-tap a point", meaning: "opens it" },
            { gesture: "Tap empty space", meaning: "clears the selected point" },
            { gesture: "Drag", meaning: "moves the cloud" },
            { gesture: "Pinch", meaning: "zooms about the fingers" },
            { gesture: "Hold a point", meaning: "opens its actions" },
            {
                gesture: "Use as A or B, after holding a point",
                meaning: "puts it in the other end and plays it, keeping the selected end",
            },
            {
                gesture: "A or B along the bottom of the cloud",
                meaning: "plays that end and selects it: every sample you tap next becomes that end",
            },
            { gesture: "The × on A or B", meaning: "clears that end; the next sample you tap fills it" },
            {
                gesture: "The Morph button",
                meaning:
                    "turns the morph off and on; while it is off, a tap only plays the point, and the pair waits for this button or Use as A or B to turn it back on",
            },
            { gesture: "The swap button", meaning: "swaps the ends and mirrors the weight" },
            { gesture: "The waveform button", meaning: "opens the morph's waveform under the slider" },
            {
                gesture: "The history button",
                meaning: "opens the samples each end has held, newest first; a tap on one makes it that end again",
            },
            { gesture: "The undo and redo buttons in the history", meaning: "undo and redo the ends" },
            { gesture: "The center button", meaning: "centers the cloud on the selected point" },
        ],
    },
];

const POINTER_GUIDE: readonly GuideSection[] = [
    {
        title: "Lists",
        entries: [
            { gesture: "Click a row", meaning: "selects the sample" },
            { gesture: "Double-click, or Enter on the name", meaning: "opens the sample or module" },
            { gesture: "↑ ↓", meaning: "move between rows" },
            { gesture: "Space", meaning: "plays the sample" },
            { gesture: "F", meaning: "marks the sample as a favorite", whenEditing: true },
            { gesture: "1 to 5", meaning: "rate the sample", whenEditing: true },
        ],
    },
    {
        title: "The open sample",
        entries: [{ gesture: "Alt+← Alt+→", meaning: "step through the listing" }],
    },
    {
        title: "The cloud",
        entries: [
            { gesture: "Click a point", meaning: "selects it and plays it" },
            { gesture: "Double-click a point", meaning: "opens it" },
            { gesture: "Drag, scroll", meaning: "move and zoom the cloud" },
            {
                gesture: "Right-click a point",
                meaning: "puts it in the other end and plays it, keeping the selected end",
            },
            {
                gesture: "A or B along the bottom of the cloud",
                meaning: "plays that end and selects it: every sample you click next becomes that end",
            },
            { gesture: "The × on A or B", meaning: "clears that end; the next sample you click fills it" },
            {
                gesture: "The Morph button",
                meaning:
                    "turns the morph off and on; while it is off, a click only plays the point, and the pair waits for this button or a right click to turn it back on",
            },
            { gesture: "The swap button", meaning: "swaps the ends and mirrors the weight" },
            { gesture: "The waveform button", meaning: "opens the morph's waveform under the slider" },
            {
                gesture: "The history button",
                meaning: "opens the samples each end has held, newest first; a click on one makes it that end again",
            },
            { gesture: "A, B", meaning: "select that end, from anywhere in the app" },
            {
                gesture: "Tab",
                meaning:
                    "selects the other end after a click outside the buttons; on a button, it moves to the next one",
            },
            {
                gesture: "Ctrl+Z, Ctrl+Y",
                meaning: "undo and redo the ends, from anywhere in the app; ⌘Z and ⇧⌘Z on a Mac",
            },
            { gesture: "Escape", meaning: "clears the selected point" },
        ],
    },
];

const TITLES: Readonly<Record<InputMode, string>> = { touch: "Gestures", pointer: "Keyboard and mouse" };

interface GuideSheetProps {
    readonly input: InputMode;
    readonly onClose: () => void;
}

/** What each gesture, click and key does, worded for the input the person has and what they may change here. */
export function GuideSheet({ input, onClose }: GuideSheetProps): ReactElement {
    const { labelEditing } = useCurationAccess();
    const sections = input === "touch" ? TOUCH_GUIDE : POINTER_GUIDE;
    return (
        <BottomSheet title={TITLES[input]} onClose={onClose}>
            {sections.map((section) => (
                <section key={section.title} className="guide-section">
                    <h3 className="guide-title">{section.title}</h3>
                    <dl className="guide">
                        {section.entries
                            .filter((entry) => entry.whenEditing === undefined || entry.whenEditing === labelEditing)
                            .map((entry) => (
                                <div key={entry.gesture} className="guide-entry">
                                    <dt className="guide-gesture">{entry.gesture}</dt>
                                    <dd className="guide-meaning">{entry.meaning}</dd>
                                </div>
                            ))}
                    </dl>
                </section>
            ))}
        </BottomSheet>
    );
}

export const GUIDE_TITLES = TITLES;
