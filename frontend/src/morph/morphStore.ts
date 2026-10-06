import { create } from "zustand";

import {
    EMPTY_HISTORY,
    forgotten,
    type MorphHistory,
    type MorphSnapshot,
    recorded,
    redone,
    type Restored,
    sameSnapshot,
    snapshotOf,
    undone,
} from "./morphHistory";
import { readSavedHeld, saveHeld } from "./morphHistoryPersistence";

const WEIGHT_STEPS = 100;
export const WEIGHT_STEP = 1 / WEIGHT_STEPS;
export const DEFAULT_WEIGHT = 0.5;

/** Which end of the pair a control speaks of. */
export type MorphEnd = "first" | "second";

/** The letter each end goes by on screen. */
export const END_LETTERS: Readonly<Record<MorphEnd, string>> = { first: "A", second: "B" };

/**
 * The weight held to the unit interval and to the grid of hundredths the renderer serves, so a
 * snapped weight writes as one two-place decimal in a URL and names exactly one cached render.
 */
export function snapWeight(weight: number): number {
    const clamped = Math.min(1, Math.max(0, weight));
    return Math.round(clamped * WEIGHT_STEPS) / WEIGHT_STEPS;
}

export interface MorphPair {
    readonly first: string | null;
    readonly second: string | null;
    /**
     * The weight of the render on screen: the slider's point once both ends are chosen, then whichever
     * point was let go last; `null` while an end is missing.
     */
    readonly renderedWeight: number | null;
}

interface MorphState extends MorphSnapshot, MorphHistory {
    /** The end that takes every sample picked next. */
    readonly selectedEnd: MorphEnd;
    /** Whether the morph is on: picking fills its ends, and the strip and the link show it. */
    readonly enabled: boolean;
}

interface MorphActions {
    /** Makes `hash` the sample at `end`; a sample already at the other end trades places with it, the weight mirrored. */
    readonly setEnd: (end: MorphEnd, hash: string) => void;
    readonly swap: () => void;
    readonly setWeight: (weight: number) => void;
    /** Records the current weight as the point whose render is on screen. */
    readonly markRendered: () => void;
    readonly selectEnd: (end: MorphEnd) => void;
    /** Turns the morph on or off, the pair staying as it stands. */
    readonly setEnabled: (enabled: boolean) => void;
    /**
     * Gives a picked sample to the selected end, the selection staying on it; a sample the pair
     * already holds, or a morph turned off, leaves everything as it is.
     */
    readonly takeSample: (hash: string) => void;
    /** Turns the morph on and makes `hash` the sample at the end opposite the selected one, the selection staying. */
    readonly takeSampleAtOtherEnd: (hash: string) => void;
    /** Empties `end`, as a step undo can take back, and selects it so the next pick fills it. */
    readonly discard: (end: MorphEnd) => void;
    /** Returns the ends, the drawn point and the slider to how they stood before the last change. */
    readonly undo: () => void;
    /** Brings the change last undone back. */
    readonly redo: () => void;
    /** Empties both columns of the history, keeping the samples the ends hold now as their only rows. */
    readonly forgetHeld: () => void;
}

export const INITIAL_MORPH_STATE: MorphState = {
    first: null,
    second: null,
    weight: DEFAULT_WEIGHT,
    renderedWeight: null,
    selectedEnd: "first",
    enabled: true,
    ...EMPTY_HISTORY,
};

export const OTHER_END: Readonly<Record<MorphEnd, MorphEnd>> = { first: "second", second: "first" };

/**
 * The ends as chosen, at `weight`: a pair that stays keeps the render drawn for it, a pair just
 * completed is drawn at `weight` before any point of it is heard, and a pair missing an end has
 * nothing drawn.
 */
function pairOf(state: MorphSnapshot, first: string | null, second: string | null, weight: number): MorphSnapshot {
    if (first === state.first && second === state.second) {
        return { first, second, renderedWeight: state.renderedWeight, weight };
    }
    return { first, second, renderedWeight: first !== null && second !== null ? weight : null, weight };
}

/** The sample at the end opposite `end`. */
function otherEndOf(state: MorphPair, end: MorphEnd): string | null {
    return state[OTHER_END[end]];
}

/** The pair with `hash` at `end`, or `end` emptied for `null`, and the other end as it stands. */
function withSampleAt(state: MorphSnapshot, end: MorphEnd, hash: string | null): MorphSnapshot {
    return end === "first"
        ? pairOf(state, hash, state.second, state.weight)
        : pairOf(state, state.first, hash, state.weight);
}

/** The ends traded, with the weight mirrored so the audible point stays where it was. */
function swappedOf(state: MorphSnapshot): MorphSnapshot {
    return pairOf(state, state.second, state.first, snapWeight(1 - state.weight));
}

/**
 * The pair a morph runs between, how far along it the listener stands, which point of the path is
 * drawn on screen, and which end is selected to take the next sample. The strip over the cloud
 * and the marker on the cloud share it, so the two are one control. The pair is its own state,
 * filled by the samples a person picks, so it stays where it was put while the shell's highlight
 * and focus move on.
 *
 * One end is always selected, the first one at the start of a visit, and it takes every sample
 * picked in a list or on the cloud through `takeSample`. The selection stays where a person put
 * it, through a slot, a key or the clearing of an end, so every pick lands on the end they chose.
 * Taking a sample the pair already holds keeps the pair and the selection as they stand, so a
 * double click's second click, or a tap to hear an end again, holds the pair in place. `setEnd`
 * names one end outright, which is how a row of the history gives its sample back, trading places
 * when the sample sits at the other end; `takeSampleAtOtherEnd` names the end opposite the
 * selected one the same way, which is how a right click on the cloud fills it. `discard` empties
 * one end and selects it, so the next pick fills it again. `swap` mirrors the weight along with
 * the ends, so the audible point stays where it was, and keeps the selected letter. A render
 * belongs to the pair it was drawn for, so any change of the ends drops it.
 *
 * The morph can be turned off for a while: the pair waits as it stands, picking takes nothing,
 * and the strip and the link leave the screen until it is turned on again. Naming the end
 * opposite the selected one turns it back on, since that asks for the morph outright.
 *
 * Every change to the ends passes through one `commit`, which keeps two records. The columns
 * (`held`) hold the samples each end has held, newest arrival first and each once, kept across
 * visits, so a row stays where it first appeared and the pair marks its rows by holding their
 * samples. The line (`past`, `future`) holds the snapshots behind the present, which `undo`
 * restores one by one and `redo` brings back until the next change; a snapshot carries the
 * weight and the drawn point along with the ends, so undoing a swap un-mirrors the slider and
 * the render comes back as it was.
 */
export const useMorphStore = create<MorphState & MorphActions>((set, get) => {
    function commit(next: MorphSnapshot): void {
        const state = get();
        const prior = snapshotOf(state);
        if (sameSnapshot(prior, next)) {
            return;
        }
        const history = recorded(state, prior, next);
        if (history.held !== state.held) {
            saveHeld(history.held);
        }
        set({ ...next, ...history });
    }

    function restore(restored: Restored | null): void {
        if (restored === null) {
            return;
        }
        if (restored.history.held !== get().held) {
            saveHeld(restored.history.held);
        }
        set({ ...restored.snapshot, ...restored.history });
    }

    return {
        ...INITIAL_MORPH_STATE,
        held: readSavedHeld(),
        setEnd: (end, hash) => {
            const state = get();
            commit(otherEndOf(state, end) === hash ? swappedOf(state) : withSampleAt(state, end, hash));
        },
        swap: () => {
            commit(swappedOf(get()));
        },
        setWeight: (weight) => {
            set({ weight: snapWeight(weight) });
        },
        markRendered: () => {
            set({ renderedWeight: get().weight });
        },
        selectEnd: (end) => {
            set({ selectedEnd: end });
        },
        setEnabled: (enabled) => {
            set({ enabled });
        },
        takeSample: (hash) => {
            const state = get();
            if (!state.enabled || state.first === hash || state.second === hash) {
                return;
            }
            commit(withSampleAt(state, state.selectedEnd, hash));
        },
        takeSampleAtOtherEnd: (hash) => {
            if (!get().enabled) {
                set({ enabled: true });
            }
            get().setEnd(OTHER_END[get().selectedEnd], hash);
        },
        discard: (end) => {
            commit(withSampleAt(get(), end, null));
            set({ selectedEnd: end });
        },
        undo: () => {
            restore(undone(get(), snapshotOf(get())));
        },
        redo: () => {
            restore(redone(get(), snapshotOf(get())));
        },
        forgetHeld: () => {
            const state = get();
            const held = forgotten(state);
            if (held !== state.held) {
                saveHeld(held);
            }
            set({ held });
        },
    };
});
