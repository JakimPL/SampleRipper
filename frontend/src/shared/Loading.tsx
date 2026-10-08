import type { ReactElement } from "react";

import { M } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";

export function Loading(): ReactElement {
    const { text } = useMessages();
    return <p className="loading">{text(M.shared.loading)}</p>;
}
