import type { ReactElement } from "react";

import { ICON_SHAPES, type IconName, type IconPaint } from "./iconPaths";

interface IconProps {
    readonly name: IconName;
    /** What a screen reader hears; `null` marks the icon as decoration beside a visible label. */
    readonly label: string | null;
}

const ICON_VIEWBOX = "0 0 24 24";
const ICON_STROKE_WIDTH = 2;
const ICON_COLOR = "currentColor";
const UNFILLED = "none";

const FILL_BY_PAINT: Readonly<Record<IconPaint, string>> = {
    stroke: UNFILLED,
    fill: ICON_COLOR,
};

/**
 * One of the shell's icons, sized to the surrounding text and drawn in its color. A line icon is
 * its round stroke alone; a filled one is painted solid inside that stroke, which rounds its corners.
 */
export function Icon({ name, label }: IconProps): ReactElement {
    const shape = ICON_SHAPES[name];
    return (
        <svg
            className="icon"
            viewBox={ICON_VIEWBOX}
            width="1em"
            height="1em"
            fill={FILL_BY_PAINT[shape.paint]}
            stroke={ICON_COLOR}
            strokeWidth={ICON_STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            role={label === null ? undefined : "img"}
            aria-label={label ?? undefined}
            aria-hidden={label === null ? true : undefined}
        >
            <path d={shape.path} />
        </svg>
    );
}
