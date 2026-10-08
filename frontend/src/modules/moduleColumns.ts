import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";

import type { Module } from "../api/modules";
import { M } from "../messages/messageIds";
import type { Messages } from "../messages/useMessages";
import type { FittableColumn } from "../shared/columnFit";
import { UNTITLED_MODULE_LABEL } from "../shared/labels";

export type ModuleColumnId = "title" | "filename" | "tracker" | "sample_count" | "file_size" | "link";

const FILENAME_WIDTH_PX = 180;
const TRACKER_WIDTH_PX = 64;
const SAMPLE_COUNT_WIDTH_PX = 64;
const FILE_SIZE_WIDTH_PX = 80;
const LINK_WIDTH_PX = 44;

/** The modules listing's columns, in order, and how each yields as the listing narrows: the sample count first, the tracker last, the title and the page link staying. */
export const MODULE_COLUMN_SPEC: readonly FittableColumn<ModuleColumnId>[] = [
    { id: "title", widthPx: null, dropOrder: null },
    { id: "filename", widthPx: FILENAME_WIDTH_PX, dropOrder: 2 },
    { id: "tracker", widthPx: TRACKER_WIDTH_PX, dropOrder: 4 },
    { id: "sample_count", widthPx: SAMPLE_COUNT_WIDTH_PX, dropOrder: 1 },
    { id: "file_size", widthPx: FILE_SIZE_WIDTH_PX, dropOrder: 3 },
    { id: "link", widthPx: LINK_WIDTH_PX, dropOrder: null },
];

const columnHelper = createColumnHelper<Module>();

/** The listing's columns as TanStack sorts and filters them, named and sorted by the words `text` gives; their widths come from `MODULE_COLUMN_SPEC`. */
export function createModuleColumns(text: Messages["text"]): ColumnDef<Module>[] {
    return [
        columnHelper.accessor((module) => (module.title.trim() === "" ? text(UNTITLED_MODULE_LABEL) : module.title), {
            id: "title",
            header: text(M.modules.fields.title),
        }),
        columnHelper.accessor("filename", { header: text(M.modules.fields.filename) }),
        columnHelper.accessor("tracker", { header: text(M.modules.fields.tracker) }),
        columnHelper.accessor("sample_count", { header: text(M.modules.fields.samples) }),
        columnHelper.accessor("file_size", { header: text(M.modules.fields.size) }),
        columnHelper.display({ id: "link", header: "" }),
    ];
}
