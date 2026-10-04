export type IconName =
    | "samples"
    | "cloud"
    | "modules"
    | "waveform"
    | "morph"
    | "history"
    | "detail"
    | "stats"
    | "external"
    | "play"
    | "pause"
    | "swap"
    | "locate"
    | "undo"
    | "redo"
    | "download"
    | "plus"
    | "minus"
    | "close"
    | "frame";

/** Whether `Icon` draws a shape as its outline alone or as a solid. */
export type IconPaint = "stroke" | "fill";

/** One icon: its path on a 24-unit grid, traced by `Icon` with a round two-unit stroke, and how it is painted. */
export interface IconShape {
    readonly path: string;
    readonly paint: IconPaint;
}

/**
 * Every icon the shell draws. The play triangle has its centroid on the grid's center, which is
 * where the eye places the middle of a triangle, so it sits centered in a round button as drawn.
 */
export const ICON_SHAPES: Readonly<Record<IconName, IconShape>> = {
    samples: { path: "M4 6h16M4 12h10M4 18h13", paint: "stroke" },
    cloud: { path: "M6 8h.01M12 5h.01M17 9h.01M9 14h.01M15 16h.01M5 18h.01M19 17h.01", paint: "stroke" },
    modules: {
        path: "M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0M19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0",
        paint: "stroke",
    },
    waveform: { path: "M3 12h2l2-6 3 12 3-9 2 6 2-3h4", paint: "stroke" },
    morph: { path: "M10 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0M20 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0M10 12h4", paint: "stroke" },
    history: { path: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M12 7v5l4 2", paint: "stroke" },
    detail: { path: "M12 8h.01M11 12h1v4h1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0", paint: "stroke" },
    stats: { path: "M5 20v-9M12 20V4M19 20v-6", paint: "stroke" },
    external: { path: "M14 4h6v6M20 4l-9 9M18 13v6H5V6h6", paint: "stroke" },
    play: { path: "M8 5v14l11-7z", paint: "fill" },
    pause: { path: "M7 5h2v14H7zM15 5h2v14h-2z", paint: "fill" },
    swap: { path: "M16 3l4 4-4 4M20 7H4M8 13l-4 4 4 4M4 17h16", paint: "stroke" },
    locate: {
        path: "M12 2v3M12 19v3M2 12h3M19 12h3M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
        paint: "stroke",
    },
    undo: { path: "M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11", paint: "stroke" },
    redo: { path: "M15 14l5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13", paint: "stroke" },
    download: { path: "M12 4v11M7 10l5 5 5-5M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3", paint: "stroke" },
    plus: { path: "M12 5v14M5 12h14", paint: "stroke" },
    minus: { path: "M5 12h14", paint: "stroke" },
    close: { path: "M6 6l12 12M18 6L6 18", paint: "stroke" },
    frame: { path: "M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5", paint: "stroke" },
};
