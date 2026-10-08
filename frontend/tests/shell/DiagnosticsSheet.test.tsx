import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useCloudDotsStore } from "../../src/cloud/cloudDotsStore";
import type { FloatRenderingSupport } from "../../src/cloud/floatRendering";
import { M } from "../../src/messages/messageIds";
import { DiagnosticsSheet } from "../../src/shell/DiagnosticsSheet";

const WITHOUT_BLENDING: FloatRenderingSupport = {
    webgl: true,
    textureFloat: true,
    colorBufferFloat: true,
    floatBlend: false,
    renderer: "Apple GPU",
};

describe("DiagnosticsSheet", () => {
    it("states what the browser's WebGL supports and how the points draw as a result", () => {
        render(<DiagnosticsSheet support={WITHOUT_BLENDING} onClose={vi.fn()} />);

        expect(screen.getByRole("dialog", { name: M.shell.diagnostics.title })).toBeInTheDocument();
        expect(screen.getByText("Apple GPU")).toBeInTheDocument();
        expect(screen.getByText(M.shell.diagnostics.facts.floatBlending).nextElementSibling).toHaveTextContent(
            M.shell.diagnostics.no,
        );
        expect(screen.getByText(M.shell.diagnostics.pointsPlainFallback)).toBeInTheDocument();
        expect(screen.getByText(M.shell.diagnostics.facts.layout).nextElementSibling).toHaveTextContent(
            "workspace, pointer",
        );
    });

    it("says nothing draws without WebGL", () => {
        render(
            <DiagnosticsSheet
                support={{
                    webgl: false,
                    textureFloat: false,
                    colorBufferFloat: false,
                    floatBlend: false,
                    renderer: null,
                }}
                onClose={vi.fn()}
            />,
        );

        expect(screen.getByText(M.shell.diagnostics.facts.webgl).nextElementSibling).toHaveTextContent(
            M.shell.diagnostics.webglUnavailable,
        );
        expect(screen.getByText(M.shell.diagnostics.pointsNeedWebgl)).toBeInTheDocument();
    });

    it("lets a person choose plain dots, and closes from its scrim", () => {
        const onClose = vi.fn();
        render(<DiagnosticsSheet support={WITHOUT_BLENDING} onClose={onClose} />);
        expect(screen.getByRole("radio", { name: M.shell.diagnostics.dotsAuto })).toBeChecked();

        fireEvent.click(screen.getByRole("radio", { name: M.shell.diagnostics.dotsPlain }));

        expect(useCloudDotsStore.getState().dots).toBe("plain");
        expect(screen.getByRole("radio", { name: M.shell.diagnostics.dotsPlain })).toBeChecked();
        fireEvent.click(screen.getByRole("button", { name: M.shared.close }));
        expect(onClose).toHaveBeenCalled();
    });
});
