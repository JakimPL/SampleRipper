import type { ReactElement } from "react";

import { useCurationAccess } from "../samples/useCurationAccess";
import { BottomSheet } from "../shared/overlay/BottomSheet";
import { useLabelColor } from "../theme/useLabelColor";
import { type ColoringMode, ColoringModeChoice } from "./ColoringModeChoice";
import type { TopLevelTag } from "./labelColoring";
import { LegendChip } from "./LegendChip";

interface LegendSheetProps {
    readonly mode: ColoringMode;
    readonly onModeChange: (mode: ColoringMode) => void;
    readonly tags: readonly TopLevelTag[];
    readonly painted: readonly string[];
    readonly onToggle: (name: string) => void;
    /** What the sheet says while the chosen mode has no tag to paint yet. */
    readonly emptyCaption: string;
    readonly onClose: () => void;
}

/**
 * The legend as a sheet, for a cloud too narrow to hold its chips in a row: the choice of what
 * paints the points, then every top-level tag in its color, at a finger's size, each a switch for
 * whether the cloud paints it; while the chosen mode has no tag yet, the sheet says so.
 */
export function LegendSheet({
    mode,
    onModeChange,
    tags,
    painted,
    onToggle,
    emptyCaption,
    onClose,
}: LegendSheetProps): ReactElement {
    const { curationShown } = useCurationAccess();
    const colorOf = useLabelColor();

    return (
        <BottomSheet title="Legend" onClose={onClose}>
            {curationShown && (
                <fieldset className="legend-sheet-mode">
                    <legend>Color by</legend>
                    <ColoringModeChoice mode={mode} onModeChange={onModeChange} />
                </fieldset>
            )}
            {tags.length === 0 ? (
                <p className="legend-sheet-empty">{emptyCaption}</p>
            ) : (
                <div className="legend-sheet-chips" role="group" aria-label="Tags shown">
                    {tags.map((tag) => (
                        <LegendChip
                            key={tag.name}
                            name={tag.name}
                            count={tag.sampleCount}
                            color={colorOf(tag.rank)}
                            painted={painted.includes(tag.name)}
                            onToggle={() => {
                                onToggle(tag.name);
                            }}
                        />
                    ))}
                </div>
            )}
        </BottomSheet>
    );
}
