import { useMemo, useState } from "react";

import type { ModuleCloudPoint } from "../api/cloud";
import type { TrackerFormat } from "../api/modules";
import type { PointColoring } from "./pointColoring";
import { trackerColoring, type TrackerCount, trackerCounts } from "./trackerColoring";
import { useModuleCloud } from "./useModuleCloud";

const NO_POINTS: readonly ModuleCloudPoint[] = [];
const NO_FORMATS: ReadonlySet<TrackerFormat> = new Set();

/** The module cloud's coloring together with what its legend lists and toggles. */
export interface ModuleColoring {
    readonly coloring: PointColoring;
    readonly counts: readonly TrackerCount[];
    readonly painted: readonly TrackerFormat[];
    readonly togglePainted: (format: TrackerFormat) => void;
}

/**
 * How the module points are colored: each module in its format's stamp color, every format the
 * cloud holds painted until a person turns one off in the legend, which lays its modules on the
 * ground with the substrate. The points come through the request cache the cloud itself reads.
 */
export function useModuleColoring(): ModuleColoring {
    const state = useModuleCloud();
    const [unpainted, setUnpainted] = useState<ReadonlySet<TrackerFormat>>(NO_FORMATS);
    const points = state.status === "success" ? state.data : NO_POINTS;
    const counts = useMemo(() => trackerCounts(points), [points]);
    const painted = useMemo(
        () => counts.map((count) => count.format).filter((format) => !unpainted.has(format)),
        [counts, unpainted],
    );
    const coloring = useMemo(() => trackerColoring(points, painted), [points, painted]);

    function togglePainted(format: TrackerFormat): void {
        setUnpainted((current) => {
            const next = new Set(current);
            if (!next.delete(format)) {
                next.add(format);
            }
            return next;
        });
    }

    return { coloring, counts, painted, togglePainted };
}
