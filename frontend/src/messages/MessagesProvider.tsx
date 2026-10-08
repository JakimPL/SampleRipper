import type { ReactElement, ReactNode } from "react";
import { IntlProvider } from "react-intl";

import { CATALOG_EN } from "./catalog.en";
import { flattenCatalog } from "./messageIds";

const LOCALE = "en";
const MESSAGES = flattenCatalog(CATALOG_EN, "");

export function MessagesProvider({ children }: { readonly children: ReactNode }): ReactElement {
    return (
        <IntlProvider locale={LOCALE} messages={MESSAGES}>
            {children}
        </IntlProvider>
    );
}
