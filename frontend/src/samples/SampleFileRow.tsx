import type { ReactElement } from "react";

import type { SampleDetail } from "../api/samples";
import { M } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";

type SampleFile = SampleDetail["files"][number];

/** The columns of the files table, as its header and its stacked rows both name them. */
export const FILE_COLUMN_LABELS = {
    file: M.samples.columns.file,
    directory: M.samples.columns.directory,
    rate: M.samples.columns.rate,
    status: M.samples.columns.status,
} as const;

interface SampleFileRowProps {
    readonly sampleFile: SampleFile;
}

/**
 * One file of a sample directory a sample was found in, named in its folder, marked when the file is
 * gone or changed since its scan. A server that reports no file's state marks none.
 */
export function SampleFileRow({ sampleFile }: SampleFileRowProps): ReactElement {
    const { text } = useMessages();
    return (
        <tr>
            <td className="cell-name" data-label={text(FILE_COLUMN_LABELS.file)}>
                <span className="cell-primary">{sampleFile.relative_path}</span>
            </td>
            <td className="cell-muted" data-label={text(FILE_COLUMN_LABELS.directory)}>
                {sampleFile.directory}
            </td>
            <td className="mono" data-label={text(FILE_COLUMN_LABELS.rate)}>
                {sampleFile.rate}
            </td>
            <td data-label={text(FILE_COLUMN_LABELS.status)}>
                {sampleFile.available === false && (
                    <span className="badge badge-unavailable">{text(M.samples.fileUnavailable)}</span>
                )}
            </td>
        </tr>
    );
}
