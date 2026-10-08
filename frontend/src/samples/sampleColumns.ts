import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";

import type { SampleSummary } from "../api/samples";
import type { InputMode } from "../layout/layoutMode";
import { M } from "../messages/messageIds";
import type { Messages } from "../messages/useMessages";
import type { FittableColumn } from "../shared/columnFit";
import { UNNAMED_SAMPLE_LABEL } from "../shared/labels";

export type SampleColumnId = "waveform" | "name" | "category" | "verdict" | "size_bytes" | "occurrence_count";

/** Every column the listing may show, whichever of them fit and are shown. */
export const SAMPLE_COLUMN_IDS: readonly SampleColumnId[] = [
    "waveform",
    "name",
    "category",
    "verdict",
    "size_bytes",
    "occurrence_count",
];

const WAVEFORM_WIDTH_PX = 76;
const CATEGORY_WIDTH_PX = 144;
/** Six slots for the stars and the heart under a pointer; one tap target for the heart alone under touch. */
const VERDICT_WIDTH_PX: Readonly<Record<InputMode, number>> = { pointer: 110, touch: 52 };
const SIZE_WIDTH_PX = 80;
const OCCURRENCES_WIDTH_PX = 84;

/**
 * The samples listing's columns, in order, and how each yields as the listing narrows: the counts first,
 * the verdict last. A listing showing no one's ratings or favorites holds no verdict column.
 */
export function sampleColumnSpec(input: InputMode, curationShown: boolean): readonly FittableColumn<SampleColumnId>[] {
    const verdict: readonly FittableColumn<SampleColumnId>[] = curationShown
        ? [{ id: "verdict", widthPx: VERDICT_WIDTH_PX[input], dropOrder: 4 }]
        : [];
    return [
        { id: "waveform", widthPx: WAVEFORM_WIDTH_PX, dropOrder: null },
        { id: "name", widthPx: null, dropOrder: null },
        { id: "category", widthPx: CATEGORY_WIDTH_PX, dropOrder: 3 },
        ...verdict,
        { id: "size_bytes", widthPx: SIZE_WIDTH_PX, dropOrder: 2 },
        { id: "occurrence_count", widthPx: OCCURRENCES_WIDTH_PX, dropOrder: 1 },
    ];
}

const columnHelper = createColumnHelper<SampleSummary>();

/** The listing's columns as TanStack sorts and filters them, named and sorted by the words `text` gives; their widths come from `sampleColumnSpec`. */
export function createSampleColumns(text: Messages["text"]): ColumnDef<SampleSummary>[] {
    return [
        columnHelper.display({ id: "waveform", header: text(M.samples.columns.waveform) }),
        columnHelper.accessor(
            (sample) => (sample.display_name.trim() === "" ? text(UNNAMED_SAMPLE_LABEL) : sample.display_name),
            { id: "name", header: text(M.samples.columns.name) },
        ),
        columnHelper.display({ id: "category", header: text(M.samples.columns.category) }),
        columnHelper.display({ id: "verdict", header: text(M.samples.columns.rating) }),
        columnHelper.accessor("size_bytes", { header: text(M.samples.columns.size) }),
        columnHelper.accessor("occurrence_count", { header: text(M.samples.columns.occurrences) }),
    ];
}
