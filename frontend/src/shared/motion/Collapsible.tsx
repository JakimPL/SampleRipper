import type { ReactElement, ReactNode, TransitionEvent } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { classNames } from "../classNames";
import { prefersReducedMotion } from "./reducedMotion";

/** Where a collapsible stands: open at rest, about to open from nothing, closing toward nothing, or gone. */
type PresencePhase = "open" | "entering" | "closing" | "closed";

// Outlasts the collapse transition in styles.css, so a closing ends by this time at the latest.
export const CLOSING_FALLBACK_MS = 400;

/**
 * The phase a toggle of `open` leads to: an opening grows from nothing, or turns a closing back
 * where it stands; a closing shrinks to nothing, and ends at once under reduced motion, where
 * nothing transitions.
 */
function phaseAfterToggle(phase: PresencePhase, open: boolean): PresencePhase {
    if (open) {
        return phase === "closing" ? "open" : "entering";
    }
    return phase === "open" && !prefersReducedMotion() ? "closing" : "closed";
}

interface CollapsibleProps {
    readonly open: boolean;
    readonly children: ReactNode;
}

/**
 * A section that opens by growing from no height and closes by shrinking back, fading as it goes,
 * so the content around it moves smoothly. The children stay mounted while the section closes,
 * inert and hidden from assistive technology, and leave once the transition has ended, or once
 * `CLOSING_FALLBACK_MS` has passed. A section open from its first render shows at once; one that
 * opens later starts from its collapsed style, which a read of its layout commits, so the browser
 * transitions from it. Under reduced motion the section opens and closes at once.
 */
export function Collapsible({ open, children }: CollapsibleProps): ReactElement | null {
    const [phase, setPhase] = useState<PresencePhase>(open ? "open" : "closed");
    const [previousOpen, setPreviousOpen] = useState(open);
    const elementRef = useRef<HTMLDivElement | null>(null);

    if (open !== previousOpen) {
        setPreviousOpen(open);
        setPhase(phaseAfterToggle(phase, open));
    }

    useLayoutEffect(() => {
        if (phase !== "entering") {
            return;
        }
        elementRef.current?.getBoundingClientRect();
        setPhase("open");
    }, [phase]);

    useEffect(() => {
        if (phase !== "closing") {
            return undefined;
        }
        const timeout = setTimeout(() => {
            setPhase("closed");
        }, CLOSING_FALLBACK_MS);
        return (): void => {
            clearTimeout(timeout);
        };
    }, [phase]);

    function handleTransitionEnd(event: TransitionEvent<HTMLDivElement>): void {
        if (event.target === event.currentTarget && phase === "closing") {
            setPhase("closed");
        }
    }

    if (phase === "closed") {
        return null;
    }
    return (
        <div
            ref={elementRef}
            className={classNames("collapsible", phase !== "open" && "is-collapsed")}
            aria-hidden={open ? undefined : true}
            inert={!open}
            onTransitionEnd={handleTransitionEnd}
        >
            <div className="collapsible-content">{children}</div>
        </div>
    );
}
