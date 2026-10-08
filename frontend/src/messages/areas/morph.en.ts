export const MORPH_MESSAGES = {
    strip: "Morph",
    offline: "Morphing isn't available right now.",
    checkAgain: "Check again",
    history: "History",
    weight: "Point along the morph",
    swap: "Swap the two ends",
    waveform: "Waveform",
    playMorph: "Play the morph",
    saveRender: "Save this render",
    distance: {
        computing: "Computing distance…",
        value: "distance {distance}",
    },
    slot: {
        empty: "empty",
        labeled: "{letter}: {spoken}",
        clearFirst: "Clear A",
        clearSecond: "Clear B",
    },
    held: {
        undo: "Undo",
        redo: "Redo",
        forgetAll: "Forget all",
        emptyColumn: "Nothing yet.",
        count: "{count, plural, one {# sample} other {# samples}}",
    },
} as const;
