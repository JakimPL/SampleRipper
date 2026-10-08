import { type ReactElement, useState } from "react";
import { useNavigate } from "react-router-dom";

import { quitApplication, type SetupState } from "../api/setup";
import { M, type Message } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { failureOf } from "../shared/failure";
import { Loading } from "../shared/Loading";
import { CLOSED_PATH } from "./ClosedView";
import { LibraryPanel } from "./LibraryPanel";
import { SetupTopBar } from "./SetupTopBar";
import { SourcesForm } from "./SourcesForm";
import { lastKnownState, type SetupSource, useSetupState } from "./useSetupState";
import { useSourcesDraft } from "./useSourcesDraft";

interface SetupPanesProps {
    readonly state: SetupState;
    readonly onChanged: (state: SetupState) => void;
}

/** The folders beside the library, sharing the folders being edited so the library holds its builds while they differ. */
function SetupPanes({ state, onChanged }: SetupPanesProps): ReactElement {
    const draft = useSourcesDraft(state);
    return (
        <div className="setup-panes">
            <SourcesForm state={state} draft={draft} onSaved={onChanged} />
            <LibraryPanel state={state} unsavedChanges={draft.unsaved} onChanged={onChanged} />
        </div>
    );
}

function SetupPlaceholder({ source }: { readonly source: SetupSource }): ReactElement | null {
    const { text } = useMessages();
    switch (source.status) {
        case "loading":
            return <Loading />;
        case "absent":
            return (
                <section className="setup-card">
                    <h2>{text(M.setup.view.unavailableTitle)}</h2>
                    <p className="setup-hint">{text(M.setup.view.unavailableBody)}</p>
                </section>
            );
        case "unreachable":
        case "ready":
            return null;
    }
}

/**
 * The application's own page: where a person names their folders, opens the library, builds it and
 * closes the application, all without a terminal or a config file. It wears the workspace's bar,
 * and on a desktop the folders and the library stand side by side as two panels filling the
 * window; every control keeps its place in every state.
 */
export function SetupView(): ReactElement {
    const { source, accept } = useSetupState();
    const { textOf } = useMessages();
    const navigate = useNavigate();
    const [quitRefusal, setQuitRefusal] = useState<Message | null>(null);
    const state = lastKnownState(source);
    const unreachable: Message | null =
        source.status === "unreachable"
            ? { id: M.setup.view.unreachable, values: { message: textOf(source.failure) } }
            : null;
    const notice = quitRefusal ?? unreachable;

    async function handleQuit(): Promise<void> {
        setQuitRefusal(null);
        try {
            await quitApplication();
            void navigate(CLOSED_PATH, { replace: true });
        } catch (error: unknown) {
            setQuitRefusal(failureOf(error));
        }
    }

    return (
        <main className="setup-page">
            <SetupTopBar
                notice={notice}
                quitEnabled={state !== null}
                onQuit={() => {
                    void handleQuit();
                }}
            />
            <div className="setup-body">
                {state === null ? (
                    <SetupPlaceholder source={source} />
                ) : (
                    <SetupPanes key={state.config_path} state={state} onChanged={accept} />
                )}
            </div>
        </main>
    );
}
