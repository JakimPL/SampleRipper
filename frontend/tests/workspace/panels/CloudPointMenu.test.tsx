import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { M, type MessageId } from "../../../src/messages/messageIds";
import { type MorphEnd, OTHER_END, useMorphStore } from "../../../src/morph/morphStore";
import type * as AudioPreview from "../../../src/samples/useAudioPreview";
import { CloudPointMenu } from "../../../src/workspace/panels/CloudPointMenu";
import type { EntityRef } from "../../../src/workspace/selectionStore";

const { play, playAnswered } = vi.hoisted(() => ({
    play: vi.fn(),
    playAnswered: vi.fn().mockResolvedValue(true),
}));

vi.mock("../../../src/samples/useAudioPreview", async () => {
    const actual = await vi.importActual<typeof AudioPreview>("../../../src/samples/useAudioPreview");
    return { ...actual, useAudioPreview: () => ({ play, playAnswered, playingKey: null, failure: null }) };
});

const SAMPLE: EntityRef = { kind: "sample", hash: "a".repeat(64) };
const MODULE: EntityRef = { kind: "module", hash: "b".repeat(64) };
const MORPH_ENDS: readonly MorphEnd[] = ["first", "second"];
const USE_AS: Readonly<Record<MorphEnd, MessageId>> = {
    first: M.workspace.pointMenu.useAsFirst,
    second: M.workspace.pointMenu.useAsSecond,
};

interface MenuCallbacks {
    readonly onSelectAtOtherEnd: (entity: EntityRef) => void;
    readonly onClose: () => void;
}

function renderMenu(entity: EntityRef, callbacks: MenuCallbacks): void {
    render(
        <MemoryRouter>
            <CloudPointMenu
                entity={entity}
                playbackRateHz={null}
                onLocate={vi.fn()}
                onSelectAtOtherEnd={callbacks.onSelectAtOtherEnd}
                onClose={callbacks.onClose}
            />
        </MemoryRouter>,
    );
}

describe("CloudPointMenu", () => {
    it.each(MORPH_ENDS)(
        "offers a held sample to the end opposite the selected %s end, and closes once it is given",
        (selectedEnd: MorphEnd) => {
            useMorphStore.getState().selectEnd(selectedEnd);
            const onSelectAtOtherEnd = vi.fn();
            const onClose = vi.fn();
            renderMenu(SAMPLE, { onSelectAtOtherEnd, onClose });

            fireEvent.click(screen.getByRole("button", { name: USE_AS[OTHER_END[selectedEnd]] }));

            expect(onSelectAtOtherEnd).toHaveBeenCalledWith(SAMPLE);
            expect(onClose).toHaveBeenCalledTimes(1);
        },
    );

    it("keeps a module out of the morph", () => {
        renderMenu(MODULE, { onSelectAtOtherEnd: vi.fn(), onClose: vi.fn() });

        for (const end of MORPH_ENDS) {
            expect(screen.queryByRole("button", { name: USE_AS[end] })).not.toBeInTheDocument();
        }
        expect(screen.getByRole("button", { name: M.samples.rowActions.open })).toBeInTheDocument();
    });
});
