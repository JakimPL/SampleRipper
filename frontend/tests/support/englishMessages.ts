import { createIntl } from "react-intl";

import { CATALOG_EN } from "../../src/messages/catalog.en";
import type { MessageId, MessageValues } from "../../src/messages/messageIds";
import { flattenCatalog } from "../../src/messages/messageIds";

const INTL = createIntl({ locale: "en", messages: flattenCatalog(CATALOG_EN, "") });

/** A message in real English, for the few tests of how a message handles counts and durations. */
export function englishText(id: MessageId, values?: MessageValues): string {
    return INTL.formatMessage({ id }, values);
}
