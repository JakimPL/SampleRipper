import { type ReactElement, useState } from "react";

import { floatRenderingSupport } from "../cloud/floatRendering";
import { useLayoutMode } from "../layout/useLayoutMode";
import { M } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { Button } from "../shared/controls/Button";
import { DisclosureMenu } from "../shared/overlay/DisclosureMenu";
import { ABOUT_TITLE, AboutSheet } from "./AboutSheet";
import { DIAGNOSTICS_TITLE, DiagnosticsSheet } from "./DiagnosticsSheet";
import { GUIDE_TITLES, GuideSheet } from "./GuideSheet";

/** The guide to the keys and clicks, or to the gestures under touch, what this browser can draw, and what the app is. */
export function HelpMenu(): ReactElement {
    const [guideOpen, setGuideOpen] = useState(false);
    const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const { input } = useLayoutMode();
    const { text } = useMessages();

    return (
        <>
            <DisclosureMenu label={text(M.shell.menus.help)} className="help-menu" variant="quiet">
                <Button
                    variant="quiet"
                    wide
                    className="menu-action"
                    onClick={() => {
                        setGuideOpen(true);
                    }}
                >
                    {text(GUIDE_TITLES[input])}
                </Button>
                <Button
                    variant="quiet"
                    wide
                    className="menu-action"
                    onClick={() => {
                        setDiagnosticsOpen(true);
                    }}
                >
                    {text(DIAGNOSTICS_TITLE)}
                </Button>
                <Button
                    variant="quiet"
                    wide
                    className="menu-action"
                    onClick={() => {
                        setAboutOpen(true);
                    }}
                >
                    {text(ABOUT_TITLE)}
                </Button>
            </DisclosureMenu>
            {guideOpen && (
                <GuideSheet
                    input={input}
                    onClose={() => {
                        setGuideOpen(false);
                    }}
                />
            )}
            {diagnosticsOpen && (
                <DiagnosticsSheet
                    support={floatRenderingSupport()}
                    onClose={() => {
                        setDiagnosticsOpen(false);
                    }}
                />
            )}
            {aboutOpen && (
                <AboutSheet
                    onClose={() => {
                        setAboutOpen(false);
                    }}
                />
            )}
        </>
    );
}
