import { useCallback, useMemo } from "react";

import { labelColor, readLabelPaletteParameters } from "./labelPalette";
import { useThemeSignal } from "./useThemeSignal";

/**
 * A tag's color from its lasting rank, at the lightness and chroma the current theme declares. The
 * parameters are read again on every theme change, the way the cloud re-reads its own, so a swatch
 * and the points it names stay one color.
 */
export function useLabelColor(): (rank: number) => string {
    const themeSignal = useThemeSignal();
    const parameters = useMemo(readLabelPaletteParameters, [themeSignal.preference, themeSignal.systemVersion]);
    return useCallback((rank: number) => labelColor(rank, parameters), [parameters]);
}
