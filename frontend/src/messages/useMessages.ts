import type { ReactNode } from "react";
import { useMemo } from "react";
import { useIntl } from "react-intl";

import type { Message, MessageId, MessageValues } from "./messageIds";

export interface Messages {
    /** The message as plain text, for attributes and strings a component composes further. */
    readonly text: (id: MessageId, values?: MessageValues) => string;
    readonly textOf: (message: Message) => string;
    /** The message with elements in its placeholders, e.g. a link, as renderable content. */
    readonly rich: (id: MessageId, values: Readonly<Record<string, ReactNode>>) => ReactNode;
}

export function useMessages(): Messages {
    const intl = useIntl();
    return useMemo(() => {
        const text = (id: MessageId, values?: MessageValues): string => intl.formatMessage({ id }, values);
        return {
            text,
            textOf: (message) => text(message.id, message.values),
            rich: (id, values) => intl.formatMessage({ id }, values),
        };
    }, [intl]);
}
