import type { MouseEvent, ReactElement, ReactNode, RefObject } from "react";
import { useEffect, useRef } from "react";

import { SampleName } from "../samples/SampleName";
import { samplePreview, useAudioPreview } from "../samples/useAudioPreview";
import { spokenNameOf, useSampleName } from "../samples/useSampleName";
import { classNames } from "../shared/classNames";
import { KEYBOARD_CLICK_DETAIL } from "../shared/gestures/gestureThresholds";
import { Icon } from "../shared/icons/Icon";
import { useSelectionStore } from "../workspace/selectionStore";
import { END_LETTERS, type MorphEnd, useMorphStore } from "./morphStore";
import { useEndpoint } from "./useEndpoint";

const EMPTY_READING = "empty";
const CLEAR_LABELS: Readonly<Record<MorphEnd, string>> = { first: "Clear A", second: "Clear B" };

interface MorphSlotProps {
    readonly end: MorphEnd;
    /** The sample this end holds, or `null` before its first. */
    readonly hash: string | null;
}

interface ChosenEndProps {
    readonly end: MorphEnd;
    readonly hash: string;
    readonly slotRef: RefObject<HTMLButtonElement | null>;
    /** Called as a key press on the × empties the end, before the end's empty slot takes its place. */
    readonly onKeyboardClear: () => void;
}

interface EmptyEndProps {
    readonly end: MorphEnd;
    readonly slotRef: RefObject<HTMLButtonElement | null>;
}

interface SlotButtonProps {
    readonly end: MorphEnd;
    /** What the end says to a screen reader after its letter. */
    readonly spoken: string;
    readonly empty: boolean;
    readonly onClick: () => void;
    readonly buttonRef: RefObject<HTMLButtonElement | null>;
    readonly children: ReactNode;
}

/**
 * The button every slot is: the end's letter and what it holds, pressed while the end is selected.
 * A click lets the focus go, so Tab goes on switching the ends; a key press keeps it on the slot.
 */
function SlotButton({ end, spoken, empty, onClick, buttonRef, children }: SlotButtonProps): ReactElement {
    const selected = useMorphStore((state) => state.selectedEnd === end);
    const letter = END_LETTERS[end];

    function handleClick(event: MouseEvent<HTMLButtonElement>): void {
        onClick();
        if (event.detail !== KEYBOARD_CLICK_DETAIL) {
            event.currentTarget.blur();
        }
    }

    return (
        <button
            ref={buttonRef}
            type="button"
            className={classNames("morph-slot", empty && "morph-slot-empty", selected && "is-selected")}
            aria-label={`${letter}: ${spoken}`}
            aria-pressed={selected}
            onClick={handleClick}
        >
            <span className="morph-slot-letter mono">{letter}</span>
            <span className="morph-slot-name">{children}</span>
        </button>
    );
}

/**
 * The end as chosen: a tap plays its sample at the sample's own rate, takes it in hand and selects
 * the end, and the × beside it empties the end.
 */
function ChosenEnd({ end, hash, slotRef, onKeyboardClear }: ChosenEndProps): ReactElement {
    const name = useSampleName(hash);
    const reading = useEndpoint(hash);
    const selectEnd = useMorphStore((state) => state.selectEnd);
    const discard = useMorphStore((state) => state.discard);
    const highlightEntity = useSelectionStore((state) => state.highlightEntity);
    const { play } = useAudioPreview();

    function handleClick(): void {
        play(samplePreview(hash, reading.rateHz));
        highlightEntity({ kind: "sample", hash });
        selectEnd(end);
    }

    return (
        <div className="morph-slot-group">
            <SlotButton
                end={end}
                spoken={spokenNameOf(hash, name)}
                empty={false}
                onClick={handleClick}
                buttonRef={slotRef}
            >
                <SampleName hash={hash} name={name} />
            </SlotButton>
            <button
                type="button"
                className="morph-slot-clear"
                aria-label={CLEAR_LABELS[end]}
                onClick={(event) => {
                    if (event.detail === KEYBOARD_CLICK_DETAIL) {
                        onKeyboardClear();
                    }
                    discard(end);
                }}
            >
                <Icon name="close" label={null} />
            </button>
        </div>
    );
}

function EmptyEnd({ end, slotRef }: EmptyEndProps): ReactElement {
    const selectEnd = useMorphStore((state) => state.selectEnd);

    return (
        <div className="morph-slot-group">
            <SlotButton
                end={end}
                spoken={EMPTY_READING}
                empty
                onClick={() => {
                    selectEnd(end);
                }}
                buttonRef={slotRef}
            >
                {EMPTY_READING}
            </SlotButton>
        </div>
    );
}

/**
 * One end of the morph pair as the strip shows it. The selected end takes every sample picked
 * next, in a list or on the cloud; a tap on a slot selects its end, and the × of a chosen end
 * empties it and selects it, a step undo takes back. A key press on the × hands the focus to the
 * end's empty slot, so a keyboard stays on the end it just emptied.
 */
export function MorphSlot({ end, hash }: MorphSlotProps): ReactElement {
    const slotRef = useRef<HTMLButtonElement | null>(null);
    const clearingRef = useRef(false);

    useEffect(() => {
        if (hash === null && clearingRef.current) {
            clearingRef.current = false;
            slotRef.current?.focus();
        }
    }, [hash]);

    function handleKeyboardClear(): void {
        clearingRef.current = true;
    }

    return hash === null ? (
        <EmptyEnd end={end} slotRef={slotRef} />
    ) : (
        <ChosenEnd end={end} hash={hash} slotRef={slotRef} onKeyboardClear={handleKeyboardClear} />
    );
}
