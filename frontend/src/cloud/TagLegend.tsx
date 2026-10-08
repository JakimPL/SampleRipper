import type { ReactElement } from "react";
import { useRef, useState } from "react";

import { useDismissal } from "../shared/overlay/useDismissal";
import { useLabelColor } from "../theme/useLabelColor";
import type { TopLevelTag } from "./labelColoring";
import { LegendChip } from "./LegendChip";

interface TagLegendProps {
    readonly tags: readonly TopLevelTag[];
    readonly painted: readonly string[];
    readonly onToggle: (name: string) => void;
    /** What the legend says while no sample carries a tag of its kind. */
    readonly emptyCaption: string;
}

const COLLAPSE_LABEL = "Painted only";

/**
 * The legend that is also the picker, as the end of the cloud's toolbar row: the top-level tags
 * painted on the cloud, most used first, each in the color its rank gives it, with the rest of the
 * vocabulary one toggle away. At rest the painted chips fill the rest of the row and scroll
 * sideways, so the toolbar stays one row however many tags a person has written. Expanded, every
 * tag drops into a panel over the cloud's top edge, in the same order and wrapping into at most
 * three rows that scroll, so a chip keeps its place whether or not its neighbors are shown and the
 * cloud keeps its size; the toggle, Escape or a press outside the legend takes the panel away.
 * Colors are read back from the theme on every theme change, the same way the cloud re-reads its
 * own, so a swatch and the points it names stay one color.
 */
export function TagLegend({ tags, painted, onToggle, emptyCaption }: TagLegendProps): ReactElement {
    const [expanded, setExpanded] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const colorOf = useLabelColor();
    useDismissal(rootRef, expanded, () => {
        setExpanded(false);
    });

    if (tags.length === 0) {
        return (
            <p className="tag-legend-caption" title={emptyCaption}>
                {emptyCaption}
            </p>
        );
    }

    const paintedTags = tags.filter((tag) => painted.includes(tag.name));
    const hiddenCount = tags.length - paintedTags.length;

    function chipOf(tag: TopLevelTag): ReactElement {
        return (
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
        );
    }

    return (
        <div ref={rootRef} className="tag-legend" role="group" aria-label="Painted tags">
            <div className="tag-legend-chips">{!expanded && paintedTags.map(chipOf)}</div>
            {(hiddenCount > 0 || expanded) && (
                <button
                    type="button"
                    className="tag-legend-toggle"
                    aria-expanded={expanded}
                    onClick={() => {
                        setExpanded((current) => !current);
                    }}
                >
                    {expanded ? COLLAPSE_LABEL : `+${String(hiddenCount)} more`}
                </button>
            )}
            {expanded && <div className="tag-legend-overlay">{tags.map(chipOf)}</div>}
        </div>
    );
}
