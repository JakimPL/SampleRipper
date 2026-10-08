import type { ReactElement } from "react";

import type { MessageId } from "../messages/messageIds";
import { M } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { Button } from "../shared/controls/Button";

/** What the cloud paints its samples by: the listening model's category, or the hand labels. */
export type ColoringMode = "category" | "label";

interface ColoringModeChoiceProps {
    readonly mode: ColoringMode;
    readonly onModeChange: (mode: ColoringMode) => void;
}

interface ModeChoice {
    readonly mode: ColoringMode;
    readonly label: MessageId;
}

const CHOICES: readonly ModeChoice[] = [
    { mode: "category", label: M.cloud.coloring.category },
    { mode: "label", label: M.cloud.coloring.labels },
];

/**
 * The two ways the cloud paints its samples, one pressed, the same control in the toolbar and in the
 * legend's sheet. A library showing no one's labels paints by category alone, where its callers offer
 * no choice.
 */
export function ColoringModeChoice({ mode, onModeChange }: ColoringModeChoiceProps): ReactElement {
    const { text } = useMessages();

    return (
        <>
            {CHOICES.map((choice) => (
                <Button
                    key={choice.mode}
                    variant="secondary"
                    aria-pressed={mode === choice.mode}
                    onClick={() => {
                        onModeChange(choice.mode);
                    }}
                >
                    {text(choice.label)}
                </Button>
            ))}
        </>
    );
}
