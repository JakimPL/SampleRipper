import type { RefObject } from "react";
import { useEffect, useRef } from "react";

/**
 * Takes an open panel away on Escape or on a press anywhere outside the element `rootRef` holds,
 * the way every small panel a control drops closes. The listeners stand only while `open` holds.
 */
export function useDismissal(rootRef: RefObject<HTMLElement | null>, open: boolean, onDismiss: () => void): void {
    const onDismissRef = useRef(onDismiss);
    onDismissRef.current = onDismiss;

    useEffect(() => {
        if (!open) {
            return undefined;
        }
        function handlePointerDown(event: PointerEvent): void {
            const root = rootRef.current;
            if (root !== null && event.target instanceof Node && !root.contains(event.target)) {
                onDismissRef.current();
            }
        }
        function handleKeyDown(event: KeyboardEvent): void {
            if (event.key === "Escape") {
                onDismissRef.current();
            }
        }
        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return (): void => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, rootRef]);
}
