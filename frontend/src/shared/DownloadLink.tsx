import type { ReactElement } from "react";

import { buttonClassName } from "./controls/buttonClassName";
import { Icon } from "./icons/Icon";

interface DownloadLinkProps {
    readonly href: string;
    readonly fileName: string;
    readonly label: string;
}

/**
 * A link that saves what it points at rather than opening it, standing among a transport's own
 * controls.
 *
 * The name the file is saved under travels with the link, which a browser honors for an address on
 * the application's own origin -- every audio route is served under the API's prefix, so a saved
 * sample or render arrives named as the library calls it.
 */
export function DownloadLink({ href, fileName, label }: DownloadLinkProps): ReactElement {
    return (
        <a
            className={buttonClassName({ variant: "secondary", icon: true, className: "download-link" })}
            href={href}
            download={fileName}
            aria-label={label}
            title={label}
        >
            <Icon name="download" label={null} />
        </a>
    );
}
