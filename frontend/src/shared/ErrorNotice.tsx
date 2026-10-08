import type { ReactElement } from "react";

import type { Message } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";

interface ErrorNoticeProps {
    readonly message: Message;
}

export function ErrorNotice({ message }: ErrorNoticeProps): ReactElement {
    const { textOf } = useMessages();
    return (
        <p className="error-notice" role="alert">
            {textOf(message)}
        </p>
    );
}
