import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { M } from "../../src/messages/messageIds";
import { MessagesProvider } from "../../src/messages/MessagesProvider";
import type { useMessages as UseMessages } from "../../src/messages/useMessages";

describe("the messages of the application", () => {
    it("render as English text under the provider", async () => {
        const { useMessages } = await vi.importActual<{ useMessages: typeof UseMessages }>(
            "../../src/messages/useMessages",
        );

        function Probe(): ReactElement {
            return <p>{useMessages().text(M.navigation.notFoundTitle)}</p>;
        }

        render(
            <MessagesProvider>
                <Probe />
            </MessagesProvider>,
        );

        expect(screen.getByText(/\S+ \S+/)).toBeInTheDocument();
    });
});
