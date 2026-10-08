import type { InputMode } from "../layout/layoutMode";
import { M, type MessageId } from "../messages/messageIds";

export type HintId = "noSample" | "noModule" | "noWaveform";

/** What an empty panel says, worded for the gestures the person's input actually has. */
const HINTS: Readonly<Record<HintId, Readonly<Record<InputMode, MessageId>>>> = {
    noSample: { pointer: M.shared.hints.noSamplePointer, touch: M.shared.hints.noSampleTouch },
    noModule: { pointer: M.shared.hints.noModulePointer, touch: M.shared.hints.noModuleTouch },
    noWaveform: { pointer: M.shared.hints.noWaveformPointer, touch: M.shared.hints.noWaveformTouch },
};

export function hintFor(id: HintId, input: InputMode): MessageId {
    return HINTS[id][input];
}
