import type { ReactElement } from "react";
import { RouterProvider } from "react-router-dom";

import { useLayoutAttributes } from "./layout/layoutAttributes";
import { MessagesProvider } from "./messages/MessagesProvider";
import { router } from "./navigation/router";
import { useThemeColorMeta } from "./theme/themeColorMeta";

export function App(): ReactElement {
    useLayoutAttributes();
    useThemeColorMeta();
    return (
        <MessagesProvider>
            <RouterProvider router={router} />
        </MessagesProvider>
    );
}
