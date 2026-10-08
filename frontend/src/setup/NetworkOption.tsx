import type { ReactElement } from "react";

import type { HomeNetworkReach } from "../api/setup";
import { M, type Message } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { CheckOption } from "./CheckOption";

interface NetworkOptionProps {
    /** Whether the config opens the library to the home network, which the next start follows. */
    readonly chosen: boolean;
    /** Whether this run answers the home network, and where a device opens it. */
    readonly reach: HomeNetworkReach;
    readonly disabled: boolean;
    readonly onChoose: (openToNetwork: boolean) => void;
}

function describeReach(chosen: boolean, reach: HomeNetworkReach): Message | null {
    if (chosen !== reach.open) {
        return { id: M.setup.network.restart };
    }
    if (!reach.open) {
        return null;
    }
    return reach.address === null
        ? { id: M.setup.network.offNetwork }
        : { id: M.setup.network.address, values: { address: reach.address } };
}

/**
 * The switch opening the library to the devices on the home network, to browse and play. The
 * application follows it from its next start, so the switch says when a restart is due, and names
 * the address a device opens while the library is open to them, on a line kept whether or not it
 * has something to say.
 */
export function NetworkOption({ chosen, reach, disabled, onChoose }: NetworkOptionProps): ReactElement {
    const { text, textOf } = useMessages();
    const reachNote = describeReach(chosen, reach);
    return (
        <CheckOption
            title={text(M.setup.network.title)}
            note={text(M.setup.network.note)}
            checked={chosen}
            disabled={disabled}
            onChange={onChoose}
        >
            <span className="setup-hint network-reach">{reachNote === null ? null : textOf(reachNote)}</span>
        </CheckOption>
    );
}
