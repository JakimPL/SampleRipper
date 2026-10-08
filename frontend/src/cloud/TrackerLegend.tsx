import type { ReactElement } from "react";

import type { TrackerFormat } from "../api/modules";
import { M } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { trackerColorProperty } from "./cloudRenderSettings";
import { LegendChip } from "./LegendChip";
import type { TrackerCount } from "./trackerColoring";

interface TrackerLegendProps {
    readonly counts: readonly TrackerCount[];
    readonly painted: readonly TrackerFormat[];
    readonly onToggle: (format: TrackerFormat) => void;
}

/** A format's name as its stamp reads. */
function trackerFormatName(format: TrackerFormat): string {
    return format.toUpperCase();
}

/**
 * The module cloud's legend, which is also its picker, as the end of the cloud's toolbar row: one
 * chip per format the cloud holds, most modules first, each with a swatch in its stamp's color, the
 * format's name and its module count, pressed while the cloud paints it. The swatches read the
 * stamps' own custom properties, so a theme change recolors them together with the badges.
 */
export function TrackerLegend({ counts, painted, onToggle }: TrackerLegendProps): ReactElement {
    const { text } = useMessages();

    return (
        <div className="tag-legend" role="group" aria-label={text(M.cloud.legend.formatsShown)}>
            <div className="tag-legend-chips">
                {counts.map((count) => (
                    <LegendChip
                        key={count.format}
                        name={trackerFormatName(count.format)}
                        count={count.moduleCount}
                        color={`var(${trackerColorProperty(count.format)})`}
                        painted={painted.includes(count.format)}
                        onToggle={() => {
                            onToggle(count.format);
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
