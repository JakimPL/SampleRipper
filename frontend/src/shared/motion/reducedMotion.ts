export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Whether the person asked their system for less motion, which the transitions here then skip. */
export function prefersReducedMotion(): boolean {
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
