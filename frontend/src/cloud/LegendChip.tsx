import type { ReactElement } from "react";

interface LegendChipProps {
    readonly name: string;
    readonly count: number;
    /** The swatch's paint: any CSS color, a custom property's `var()` among them. */
    readonly color: string;
    readonly painted: boolean;
    readonly onToggle: () => void;
}

/**
 * One entry of a cloud legend that is also its picker: a swatch in the color its points wear, the
 * entry's name and how many points it holds, pressed while the cloud paints it. Both legends and the
 * legend's sheet draw their entries through it.
 */
export function LegendChip({ name, count, color, painted, onToggle }: LegendChipProps): ReactElement {
    return (
        <button type="button" className="tag-legend-entry" aria-pressed={painted} onClick={onToggle}>
            <span className="tag-legend-swatch" style={{ background: color }} aria-hidden />
            <span className="tag-legend-name">{name}</span>
            <span className="tag-legend-count">{count}</span>
        </button>
    );
}
