import type { ReactElement } from "react";
import { Link, useRouteError } from "react-router-dom";

import { M } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { ErrorNotice } from "../shared/ErrorNotice";
import { failureOf } from "../shared/failure";

/** What a view that failed to render shows: what broke, and the way back to the workspace. */
export function RouteErrorView(): ReactElement {
    const error = useRouteError();
    const { text } = useMessages();
    return (
        <main className="route-error">
            <h1>{text(M.navigation.routeErrorTitle)}</h1>
            <ErrorNotice message={failureOf(error)} />
            <p>
                <Link to="/">{text(M.navigation.backToWorkspace)}</Link>
            </p>
        </main>
    );
}
