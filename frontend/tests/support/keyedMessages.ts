import type { ReactNode } from "react";

import type { Message, MessageId, MessageValue } from "../../src/messages/messageIds";
import type { Messages } from "../../src/messages/useMessages";

function isPlain(value: unknown): value is MessageValue {
    return (
        value === null || ["string", "number", "boolean", "undefined"].includes(typeof value) || value instanceof Date
    );
}

/**
 * What a message renders as under test: its id, followed by its values as sorted JSON when it has
 * any, so a test asserts which message appeared and with which values, never how it is worded.
 */
export function keyed(id: MessageId, values?: Readonly<Record<string, unknown>>): string {
    const plain = Object.entries(values ?? {})
        .filter(([, value]) => isPlain(value))
        .sort(([first], [second]) => first.localeCompare(second));
    return plain.length === 0 ? id : `${id}${JSON.stringify(Object.fromEntries(plain))}`;
}

export const KEYED_MESSAGES: Messages = {
    text: keyed,
    textOf: (message: Message) => keyed(message.id, message.values),
    rich: (id: MessageId, values: Readonly<Record<string, ReactNode>>): ReactNode => keyed(id, values),
};
