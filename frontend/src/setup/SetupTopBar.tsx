import type { ReactElement } from "react";

import { M } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { Button } from "../shared/controls/Button";
import { ThemeMenu } from "../theme/ThemeMenu";
import { SetupMessage, type SetupMessageContent } from "./SetupMessage";

interface SetupTopBarProps {
    /** What the application has to say about itself, such as a quit it refused. */
    readonly notice: SetupMessageContent | null;
    readonly quitEnabled: boolean;
    readonly onQuit: () => void;
}

/**
 * The workspace's bar over the setup page: the name, a line reserved for the application's
 * notices, the theme, and Quit in the corner where the workspace keeps its Library menu.
 */
export function SetupTopBar({ notice, quitEnabled, onQuit }: SetupTopBarProps): ReactElement {
    const { text } = useMessages();
    return (
        <header className="top-bar">
            <span className="top-bar-title">SampleRipper</span>
            <SetupMessage
                message={notice === null ? null : { content: notice, tone: "error" }}
                className="setup-notice"
            />
            <ThemeMenu />
            <Button variant="secondary" disabled={!quitEnabled} onClick={onQuit}>
                {text(M.setup.topBar.quit)}
            </Button>
        </header>
    );
}
