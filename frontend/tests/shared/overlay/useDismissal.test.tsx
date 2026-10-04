import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { useDismissal } from "../../../src/shared/overlay/useDismissal";

function Panel({ open, onDismiss }: { readonly open: boolean; readonly onDismiss: () => void }): ReactElement {
    const rootRef = useRef<HTMLDivElement | null>(null);
    useDismissal(rootRef, open, onDismiss);
    return (
        <>
            <div ref={rootRef}>inside</div>
            <p>outside</p>
        </>
    );
}

describe("useDismissal", () => {
    it("dismisses an open panel on Escape and on a press outside it, keeping it through a press inside", () => {
        const onDismiss = vi.fn();
        render(<Panel open onDismiss={onDismiss} />);

        fireEvent.pointerDown(screen.getByText("inside"));
        expect(onDismiss).not.toHaveBeenCalled();

        fireEvent.pointerDown(screen.getByText("outside"));
        fireEvent.keyDown(document, { key: "Escape" });

        expect(onDismiss).toHaveBeenCalledTimes(2);
    });

    it("leaves a closed panel be", () => {
        const onDismiss = vi.fn();
        render(<Panel open={false} onDismiss={onDismiss} />);

        fireEvent.pointerDown(screen.getByText("outside"));
        fireEvent.keyDown(document, { key: "Escape" });

        expect(onDismiss).not.toHaveBeenCalled();
    });
});
