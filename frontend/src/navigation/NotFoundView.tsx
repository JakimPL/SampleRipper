import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import { M } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";

/** What an address naming no view of the library shows: that nothing lives there, and the way back to the workspace. */
export function NotFoundView(): ReactElement {
    const { text } = useMessages();
    return (
        <main className="not-found">
            <h1>{text(M.navigation.notFoundTitle)}</h1>
            <p>
                <Link to="/">{text(M.navigation.backToWorkspace)}</Link>
            </p>
        </main>
    );
}
