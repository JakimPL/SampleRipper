import type { KeyboardEvent, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";

import { getLabelVocabulary } from "../api/curation";
import { M } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { Button } from "../shared/controls/Button";
import { BottomSheet } from "../shared/overlay/BottomSheet";
import { useFetch } from "../shared/useFetch";
import { VOCABULARY_CACHE_KEY } from "./useAnnotationWriter";

const COMMIT_KEY = "Enter";
const VOCABULARY_CHIP_LIMIT = 24;

interface LabelSheetProps {
    readonly label: string | null;
    readonly onCommit: (label: string | null) => void;
    readonly onClose: () => void;
}

/** The known wordings that contain what was typed, the way a suggestion list would offer them. */
function matchingVocabulary(vocabulary: readonly string[], text: string): readonly string[] {
    const needle = text.trim().toLowerCase();
    return vocabulary
        .filter((known) => needle === "" || known.toLowerCase().includes(needle))
        .slice(0, VOCABULARY_CHIP_LIMIT);
}

/**
 * Where a person types what a sample is on a phone: a field at a finger's size, the wordings
 * already in use as chips that narrow as the text grows, and Done or Enter to record it. An
 * emptied field, or Clear, takes the label back, which leaves what the listening model heard
 * showing again.
 */
export function LabelSheet({ label, onCommit, onClose }: LabelSheetProps): ReactElement {
    const messages = useMessages();
    const [text, setText] = useState(label ?? "");
    const inputRef = useRef<HTMLInputElement | null>(null);
    const vocabulary = useFetch(getLabelVocabulary, [], { cacheKey: VOCABULARY_CACHE_KEY });

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    function commit(next: string | null): void {
        if (next !== label) {
            onCommit(next);
        }
        onClose();
    }

    function commitText(): void {
        const trimmed = text.trim();
        commit(trimmed === "" ? null : trimmed);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
        if (event.key === COMMIT_KEY) {
            commitText();
        }
    }

    return (
        <BottomSheet title={messages.text(M.samples.label.sheetTitle)} onClose={onClose}>
            <input
                ref={inputRef}
                className="label-sheet-input field"
                type="text"
                value={text}
                placeholder={messages.text(M.samples.label.sheetPlaceholder)}
                aria-label={messages.text(M.samples.label.handLabel)}
                autoCapitalize="characters"
                autoComplete="off"
                enterKeyHint="done"
                onChange={(event) => {
                    setText(event.target.value);
                }}
                onKeyDown={handleKeyDown}
            />
            <p className="label-sheet-helper">{messages.text(M.samples.label.helper)}</p>
            {vocabulary.status === "success" && vocabulary.data.length > 0 && (
                <div className="label-sheet-chips" role="group" aria-label={messages.text(M.samples.label.knownLabels)}>
                    {matchingVocabulary(vocabulary.data, text).map((known) => (
                        <button
                            key={known}
                            type="button"
                            onClick={() => {
                                setText(known);
                            }}
                        >
                            {known}
                        </button>
                    ))}
                </div>
            )}
            <div className="sheet-buttons">
                <Button
                    variant="secondary"
                    disabled={label === null}
                    onClick={() => {
                        commit(null);
                    }}
                >
                    {messages.text(M.samples.label.clear)}
                </Button>
                <Button variant="primary" onClick={commitText}>
                    {messages.text(M.samples.label.done)}
                </Button>
            </div>
        </BottomSheet>
    );
}
