import type { ReactElement } from "react";

import { M } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";

export const CLOSED_PATH = "/closed";

/** What a tab shows once the application it talked to has quit. */
export function ClosedView(): ReactElement {
    const { text } = useMessages();
    return (
        <main className="setup-page setup-page-closed">
            <div className="setup-body">
                <section className="setup-card">
                    <h1>{text(M.setup.closed.title)}</h1>
                    <p className="setup-hint">{text(M.setup.closed.hint)}</p>
                </section>
            </div>
        </main>
    );
}
