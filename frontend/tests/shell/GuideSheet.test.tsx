import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { M } from "../../src/messages/messageIds";
import { useCurationAccess } from "../../src/samples/useCurationAccess";
import { GuideSheet } from "../../src/shell/GuideSheet";

describe("GuideSheet", () => {
    it("spells the gestures out for touch", () => {
        render(<GuideSheet input="touch" onClose={vi.fn()} />);

        expect(screen.getByRole("dialog", { name: M.shell.guide.titles.touch })).toBeInTheDocument();
        expect(screen.getByText(M.shell.guide.gestures.pinch)).toBeInTheDocument();
        expect(screen.getByText(M.shell.guide.gestures.endButtons)).toBeInTheDocument();
        expect(screen.queryByText(M.shell.guide.gestures.stepKeys)).not.toBeInTheDocument();
    });

    it("spells the keys and clicks out for a pointer, and closes from its scrim", () => {
        const onClose = vi.fn();
        render(<GuideSheet input="pointer" onClose={onClose} />);

        expect(screen.getByRole("dialog", { name: M.shell.guide.titles.pointer })).toBeInTheDocument();
        expect(screen.getByText(M.shell.guide.gestures.stepKeys)).toBeInTheDocument();
        expect(screen.queryByText(M.shell.guide.gestures.pinch)).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: M.shared.close }));
        expect(onClose).toHaveBeenCalled();
    });

    it("leaves out the keys and gestures that change labels where they may only be seen", () => {
        vi.mocked(useCurationAccess).mockReturnValue({ curationShown: true, labelEditing: false });
        render(<GuideSheet input="pointer" onClose={vi.fn()} />);

        expect(screen.queryByText(M.shell.guide.gestures.ratingKeys)).not.toBeInTheDocument();
        expect(screen.queryByText(M.shell.guide.gestures.favoriteKey)).not.toBeInTheDocument();
        expect(screen.getByText(M.shell.guide.gestures.spaceKey)).toBeInTheDocument();
    });

    it("says a held row opens its actions where labels may only be seen", () => {
        vi.mocked(useCurationAccess).mockReturnValue({ curationShown: true, labelEditing: false });
        render(<GuideSheet input="touch" onClose={vi.fn()} />);

        expect(screen.getAllByText(M.shell.guide.meanings.opensActions)).toHaveLength(2);
        expect(screen.queryByText(M.shell.guide.meanings.opensStarsHeartLabel)).not.toBeInTheDocument();
        expect(screen.queryByText(M.shell.guide.gestures.tapHeart)).not.toBeInTheDocument();
    });
});
