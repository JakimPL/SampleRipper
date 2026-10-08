import { create } from "zustand";

interface MorphStripState {
    /** Whether the morph's waveform shows above the strip's row, beneath its slider. */
    readonly expanded: boolean;
    /** Whether the history of the ends shows: a box above the strip's slider on the workspace, a sheet on a phone. */
    readonly historyShown: boolean;
}

interface MorphStripActions {
    readonly toggleExpanded: () => void;
    readonly toggleHistoryShown: () => void;
    readonly hideHistory: () => void;
}

export const INITIAL_MORPH_STRIP_STATE: MorphStripState = { expanded: false, historyShown: false };

/**
 * How the morph strip over the cloud stands: its waveform opens from the waveform button and its
 * history from the history button, each staying as it was left for the visit.
 */
export const useMorphStripStore = create<MorphStripState & MorphStripActions>((set, get) => ({
    ...INITIAL_MORPH_STRIP_STATE,
    toggleExpanded: () => {
        set({ expanded: !get().expanded });
    },
    toggleHistoryShown: () => {
        set({ historyShown: !get().historyShown });
    },
    hideHistory: () => {
        set({ historyShown: false });
    },
}));
