import type { ReactElement } from "react";

import { M } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { buttonClassName } from "../shared/controls/buttonClassName";
import { Icon } from "../shared/icons/Icon";
import { BottomSheet } from "../shared/overlay/BottomSheet";
import { BUILD_VERSION } from "../version";

interface AboutSheetProps {
    readonly onClose: () => void;
}

export const ABOUT_TITLE = M.shell.about.title;
const APP_NAME = "SampleRipper";
const REPOSITORY_URL = "https://github.com/JakimPL/SampleRipper";
const MODULES_URL = "https://modules.pl/";
const MODULES_LABEL = "modules.pl";
const SAMPLE_MASTER_URL = "https://modsamplemaster.org/";
const SAMPLE_MASTER_LABEL = ".mod Sample Master";
const LOGO_PATH = "/favicon.svg";
const LOGO_SIZE_PX = 96;

interface ThanksLinkProps {
    readonly href: string;
    readonly label: string;
}

function ThanksLink({ href, label }: ThanksLinkProps): ReactElement {
    return (
        <a className="external-link" href={href} target="_blank" rel="noreferrer">
            {label}
            <Icon name="external" label={null} />
        </a>
    );
}

/**
 * What the app is, in one sheet: its logo, name and version, a line on what it does, who made it,
 * whom it thanks, and the way to its source. The version is the one the web app was built with, so
 * a person can copy it into a bug report; every link opens in a new tab and says so with its glyph.
 */
export function AboutSheet({ onClose }: AboutSheetProps): ReactElement {
    const { text, rich } = useMessages();
    return (
        <BottomSheet title={text(ABOUT_TITLE)} onClose={onClose}>
            <div className="about">
                <img className="about-logo" src={LOGO_PATH} alt="" width={LOGO_SIZE_PX} height={LOGO_SIZE_PX} />
                <h3 className="about-name">{APP_NAME}</h3>
                <p className="about-version">{text(M.shell.about.version, { version: BUILD_VERSION })}</p>
                <p className="about-description">{text(M.shell.about.description)}</p>
                <p className="about-author">{text(M.shell.about.author)}</p>
                <p className="about-thanks">
                    {rich(M.shell.about.thanks, {
                        aceman: <i>AceMan</i>,
                        modules: <ThanksLink href={MODULES_URL} label={MODULES_LABEL} />,
                        fred: <i>Fred / The Gang</i>,
                        sampleMaster: <ThanksLink href={SAMPLE_MASTER_URL} label={SAMPLE_MASTER_LABEL} />,
                    })}
                </p>
                <a
                    className={buttonClassName({ variant: "secondary", className: "about-link" })}
                    href={REPOSITORY_URL}
                    target="_blank"
                    rel="noreferrer"
                >
                    {text(M.shell.about.source)}
                    <Icon name="external" label={null} />
                </a>
            </div>
        </BottomSheet>
    );
}
