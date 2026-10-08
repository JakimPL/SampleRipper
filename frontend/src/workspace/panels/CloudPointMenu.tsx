import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import { type MorphEnd, OTHER_END, useMorphStore } from "../../morph/morphStore";
import { samplePreview, useAudioPreview } from "../../samples/useAudioPreview";
import { shortHash } from "../../shared/format";
import { ActionSheet, type SheetAction } from "../../shared/overlay/ActionSheet";
import type { EntityRef } from "../selectionStore";
import { entityRoute } from "../useEntityRowInteractions";

const USE_AS_LABELS: Readonly<Record<MorphEnd, string>> = { first: "Use as A", second: "Use as B" };

interface CloudPointMenuProps {
    readonly entity: EntityRef;
    readonly playbackRateHz: number | null;
    /** Brings the point to the middle of the view. */
    readonly onLocate: (hash: string) => void;
    /** Gives the sample to the morph's end opposite the selected one, as a right click on the cloud does. */
    readonly onSelectAtOtherEnd: (entity: EntityRef) => void;
    readonly onClose: () => void;
}

/**
 * What a finger held on a point can do with it: play a sample or make it the morph's end opposite
 * the selected one, named by that end's letter, open either kind, and bring the point to the
 * middle of the view.
 */
export function CloudPointMenu({
    entity,
    playbackRateHz,
    onLocate,
    onSelectAtOtherEnd,
    onClose,
}: CloudPointMenuProps): ReactElement {
    const navigate = useNavigate();
    const { play } = useAudioPreview();
    const otherEnd = useMorphStore((state) => OTHER_END[state.selectedEnd]);

    const sampleActions: readonly SheetAction[] =
        entity.kind === "sample"
            ? [
                  {
                      id: "play",
                      label: "Play",
                      disabled: false,
                      run: () => {
                          play(samplePreview(entity.hash, playbackRateHz));
                      },
                  },
                  {
                      id: "use-at-other-end",
                      label: USE_AS_LABELS[otherEnd],
                      disabled: false,
                      run: () => {
                          onSelectAtOtherEnd(entity);
                      },
                  },
              ]
            : [];
    const actions: readonly SheetAction[] = [
        ...sampleActions,
        {
            id: "open",
            label: "Open",
            disabled: false,
            run: () => {
                void navigate(entityRoute(entity));
            },
        },
        {
            id: "locate",
            label: "Center on this point",
            disabled: false,
            run: () => {
                onLocate(entity.hash);
            },
        },
    ];

    return (
        <ActionSheet
            title={`${entity.kind === "sample" ? "Sample" : "Module"} ${shortHash(entity.hash)}`}
            actions={actions}
            onClose={onClose}
        >
            {null}
        </ActionSheet>
    );
}
