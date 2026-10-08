import { type ReactElement, useState } from "react";
import { Link } from "react-router-dom";

import {
    type BuildDevice,
    type BuildTarget,
    cancelBuild,
    chooseOptions,
    type SetupState,
    startBuild,
} from "../api/setup";
import type { LibraryStats } from "../api/stats";
import { M, type Message } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { Button } from "../shared/controls/Button";
import { buttonClassName } from "../shared/controls/buttonClassName";
import { ActionSheet } from "../shared/overlay/ActionSheet";
import { BuildProgress } from "./BuildProgress";
import { CheckOption } from "./CheckOption";
import { NetworkOption } from "./NetworkOption";
import { describeRefusal } from "./refusal";
import { SetupMessage, type SetupMessageText } from "./SetupMessage";
import { SetupPane } from "./SetupPane";
import { useLibraryStats } from "./useLibraryStats";

interface LibraryPanelProps {
    readonly state: SetupState;
    /** Whether the folders pane holds edits beyond the folders the library opened with, which holds builds back. */
    readonly unsavedChanges: boolean;
    readonly onChanged: (state: SetupState) => void;
}

const DEFAULT_BUILD_CLOUD = true;
const DEFAULT_OPEN_TO_NETWORK = false;

function describeStats(stats: LibraryStats | null, building: boolean): Message {
    if (stats === null) {
        return { id: M.setup.library.open };
    }
    if (stats.sample_count === 0) {
        return { id: building ? M.setup.library.emptyBuilding : M.setup.library.empty };
    }
    return stats.module_count > 0
        ? {
              id: M.setup.library.holdsWithModules,
              values: { samples: stats.sample_count, modules: stats.module_count },
          }
        : { id: M.setup.library.holds, values: { samples: stats.sample_count } };
}

function libraryStatus(state: SetupState, unsavedChanges: boolean, stats: LibraryStats | null): SetupMessageText {
    const building = state.build?.status === "running";
    switch (state.status) {
        case "unconfigured":
            return { content: { id: M.setup.library.welcome }, tone: "normal" };
        case "starting":
            return { content: { id: M.setup.library.starting }, tone: "normal" };
        case "failed":
            return { content: state.problem ?? { id: M.setup.library.failed }, tone: "error" };
        case "ready":
            return unsavedChanges
                ? { content: { id: M.setup.library.saveFolderChangesFirst }, tone: "normal" }
                : { content: describeStats(stats, building), tone: "normal" };
    }
}

function describeDevice(device: BuildDevice | null): Message {
    if (device === null) {
        return { id: M.setup.library.checkingForCard };
    }
    return device.card === null
        ? { id: M.setup.library.deviceProcessor }
        : { id: M.setup.library.deviceCard, values: { card: device.card } };
}

interface OpenLibraryButtonProps {
    readonly ready: boolean;
    /** Whether opening is the next step, once the library holds samples. */
    readonly primary: boolean;
}

function OpenLibraryButton({ ready, primary }: OpenLibraryButtonProps): ReactElement {
    const { text } = useMessages();
    if (!ready) {
        return (
            <Button variant="secondary" disabled>
                {text(M.setup.library.openLibrary)}
            </Button>
        );
    }
    return (
        <Link className={buttonClassName({ variant: primary ? "primary" : "secondary" })} to="/">
            {text(M.setup.library.openLibrary)}
        </Link>
    );
}

/**
 * Where a person builds the open library, watches it happen and goes on to it: the library's status
 * and size, the build with its cloud switch and the device it computes on, the switch opening the
 * library to the home network, the latest build's progress, and a footer holding Build and Open,
 * the primary one being the next step: Build while the library is empty, Open once it holds
 * samples. A build going on to the cloud without an NVIDIA card asks first, since the processor
 * takes many hours over a large collection.
 */
export function LibraryPanel({ state, unsavedChanges, onChanged }: LibraryPanelProps): ReactElement {
    const { text, textOf } = useMessages();
    const [refusal, setRefusal] = useState<string | null>(null);
    const [confirming, setConfirming] = useState(false);
    const build = state.build;
    const running = build?.status === "running";
    const ready = state.status === "ready";
    const device = state.build_device;
    const buildCloud = state.options?.build_cloud ?? DEFAULT_BUILD_CLOUD;
    const openToNetwork = state.options?.open_to_network ?? DEFAULT_OPEN_TO_NETWORK;
    const canStart = ready && !running && !unsavedChanges && device !== null;
    const stats = useLibraryStats(ready, `${build?.started_at ?? ""} ${build?.status ?? ""}`);
    const empty = stats === null || stats.sample_count === 0;
    const status =
        refusal !== null ? { content: refusal, tone: "error" as const } : libraryStatus(state, unsavedChanges, stats);

    async function act(action: () => Promise<SetupState>): Promise<void> {
        setRefusal(null);
        try {
            onChanged(await action());
        } catch (error: unknown) {
            setRefusal(describeRefusal(error));
        }
    }

    function start(target: BuildTarget): void {
        void act(() => startBuild(target));
    }

    function handleBuild(): void {
        if (!buildCloud) {
            start("catalog");
        } else if (device?.card === null) {
            setConfirming(true);
        } else {
            start("all");
        }
    }

    const footer = (
        <div className="setup-footer-actions">
            <Button variant={canStart && empty ? "primary" : "secondary"} disabled={!canStart} onClick={handleBuild}>
                {text(M.setup.library.buildTitle)}
            </Button>
            <OpenLibraryButton ready={ready} primary={ready && !empty} />
        </div>
    );

    return (
        <>
            <SetupPane title={text(M.setup.library.title)} titleId="setup-library-title" footer={footer}>
                <SetupMessage message={status} className="setup-status" />

                <fieldset className="group">
                    <legend>{text(M.setup.library.buildLegend)}</legend>
                    <p className="setup-hint">{text(M.setup.library.buildNote)}</p>
                    <CheckOption
                        title={text(M.setup.library.cloudTitle)}
                        note={text(M.setup.library.cloudNote)}
                        checked={buildCloud}
                        disabled={state.options === null || running}
                        onChange={(chosen) => {
                            void act(() => chooseOptions({ build_cloud: chosen, open_to_network: openToNetwork }));
                        }}
                    />
                    <p className="setup-hint build-device">{textOf(describeDevice(device))}</p>
                </fieldset>

                <fieldset className="group">
                    <legend>{text(M.setup.library.sharingLegend)}</legend>
                    <NetworkOption
                        chosen={openToNetwork}
                        reach={state.home_network}
                        disabled={state.options === null}
                        onChoose={(chosen) => {
                            void act(() => chooseOptions({ build_cloud: buildCloud, open_to_network: chosen }));
                        }}
                    />
                </fieldset>

                <BuildProgress
                    build={build}
                    onCancel={() => {
                        void act(cancelBuild);
                    }}
                />
            </SetupPane>
            {confirming && (
                <ActionSheet
                    title={text(M.setup.library.confirmTitle)}
                    actions={[
                        {
                            id: "cloud",
                            label: text(M.setup.library.confirmWithCloud),
                            disabled: false,
                            run: () => {
                                start("all");
                            },
                        },
                        {
                            id: "catalog",
                            label: text(M.setup.library.confirmWithoutCloud),
                            disabled: false,
                            run: () => {
                                start("catalog");
                            },
                        },
                        { id: "cancel", label: text(M.shared.cancel), disabled: false, run: () => undefined },
                    ]}
                    onClose={() => {
                        setConfirming(false);
                    }}
                >
                    <p className="setup-hint">{text(M.setup.library.confirmNote)}</p>
                </ActionSheet>
            )}
        </>
    );
}
