import type { ReactElement, RefObject } from "react";
import { useEffect, useRef } from "react";

import { Collapsible } from "../shared/motion/Collapsible";
import { useMorphStore } from "./morphStore";
import { MorphStrip } from "./MorphStrip";

const NO_HEIGHT_PX = 0;

interface MorphStripDockProps {
    /** The height the dock covers along the bottom edge, in CSS pixels, as it changes; 0 once it leaves. */
    readonly onHeightChange: (heightPx: number) => void;
}

/**
 * Reports the border-box height of the element `ref` holds on every resize, as the resize is
 * observed and so before the frame paints, and 0 as the element leaves.
 */
function useReportedHeight(ref: RefObject<HTMLElement | null>, onHeightChange: (heightPx: number) => void): void {
    const onHeightChangeRef = useRef(onHeightChange);
    onHeightChangeRef.current = onHeightChange;

    useEffect(() => {
        const element = ref.current;
        if (element === null) {
            return undefined;
        }
        let reported = NO_HEIGHT_PX;
        const observer = new ResizeObserver((entries) => {
            const size = entries[0]?.borderBoxSize[0];
            if (size === undefined || size.blockSize === reported) {
                return;
            }
            reported = size.blockSize;
            onHeightChangeRef.current(reported);
        });
        observer.observe(element);
        return (): void => {
            observer.disconnect();
            onHeightChangeRef.current(NO_HEIGHT_PX);
        };
    }, [ref]);
}

/**
 * The morph strip docked along the bottom edge of the box it stands in, over whatever that box
 * shows. It slides in and out with the morph's switch, and reports the height it covers as it
 * changes, the drawer's sliding included, so the controls and the aim of the view stay clear
 * of it.
 */
export function MorphStripDock({ onHeightChange }: MorphStripDockProps): ReactElement {
    const enabled = useMorphStore((state) => state.enabled);
    const dockRef = useRef<HTMLDivElement | null>(null);
    useReportedHeight(dockRef, onHeightChange);

    return (
        <div className="morph-strip-dock" ref={dockRef}>
            <Collapsible open={enabled}>
                <MorphStrip />
            </Collapsible>
        </div>
    );
}
