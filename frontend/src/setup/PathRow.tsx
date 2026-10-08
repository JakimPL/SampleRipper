import type { ReactElement } from "react";

import { M } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { Button } from "../shared/controls/Button";
import { FolderPath } from "./FolderPath";

interface PathRowProps {
    readonly path: string | null;
    /** What the row reads while it names no folder. */
    readonly placeholder: string;
    readonly onBrowse: () => void;
    /** Clears the folder; null for a folder the library always has, such as its own location. */
    readonly onClear: (() => void) | null;
}

const CLEAR_GLYPH = "×";

/** A folder's path in a field, the way to clear it at the field's end, and Browse… beside it. */
export function PathRow({ path, placeholder, onBrowse, onClear }: PathRowProps): ReactElement {
    const { text } = useMessages();
    return (
        <div className="path-row">
            <div className="field field-static">
                <FolderPath path={path} placeholder={placeholder} />
                {onClear !== null && (
                    <Button
                        variant="quiet"
                        icon
                        aria-label={text(M.setup.folders.remove)}
                        disabled={path === null}
                        onClick={onClear}
                    >
                        {CLEAR_GLYPH}
                    </Button>
                )}
            </div>
            <Button variant="secondary" onClick={onBrowse}>
                {text(M.setup.folders.browse)}
            </Button>
        </div>
    );
}
