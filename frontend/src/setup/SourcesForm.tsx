import { type ReactElement, useState } from "react";

import { chooseSources, type LibrarySources, type SetupState } from "../api/setup";
import { M, type Message, type MessageId } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { Button } from "../shared/controls/Button";
import { failureOf } from "../shared/failure";
import { FolderPath } from "./FolderPath";
import { FolderPicker } from "./FolderPicker";
import { PathRow } from "./PathRow";
import { SetupMessage, type SetupMessageText } from "./SetupMessage";
import { SetupPane } from "./SetupPane";
import type { SourcesDraft } from "./useSourcesDraft";

interface SourcesFormProps {
    readonly state: SetupState;
    readonly draft: SourcesDraft;
    readonly onSaved: (state: SetupState) => void;
}

type PickerTarget = "modules" | "samples" | "library";

const PICKER_TITLES: Readonly<Record<PickerTarget, MessageId>> = {
    modules: M.setup.folders.pickModules,
    samples: M.setup.folders.pickSamples,
    library: M.setup.folders.pickLibrary,
};
const REMOVE_GLYPH = "×";

function withChosenFolder(sources: LibrarySources, target: PickerTarget, path: string): LibrarySources {
    switch (target) {
        case "modules":
            return { ...sources, module_source_directory: path };
        case "samples":
            return sources.sample_directories.includes(path)
                ? sources
                : { ...sources, sample_directories: [...sources.sample_directories, path] };
        case "library":
            return { ...sources, library_root: path };
    }
}

interface FooterConditions {
    readonly saving: boolean;
    readonly refusal: Message | null;
    readonly buildRunning: boolean;
    readonly hasSources: boolean;
    readonly saved: boolean;
}

function footerMessage(conditions: FooterConditions): SetupMessageText | null {
    if (conditions.saving) {
        return { content: { id: M.setup.folders.saving }, tone: "normal" };
    }
    if (conditions.refusal !== null) {
        return { content: conditions.refusal, tone: "error" };
    }
    if (conditions.buildRunning) {
        return { content: { id: M.setup.folders.waitForBuild }, tone: "normal" };
    }
    if (!conditions.hasSources) {
        return { content: { id: M.setup.folders.chooseFolderFirst }, tone: "normal" };
    }
    return conditions.saved ? { content: { id: M.setup.folders.saved }, tone: "normal" } : null;
}

/**
 * The folders a library reads and where it keeps its own files, chosen with the folder browser and
 * written into the config file on save, which opens the library under them. Every control keeps its
 * row whatever is chosen, and the footer's message line takes what the form has to say.
 */
export function SourcesForm({ state, draft, onSaved }: SourcesFormProps): ReactElement {
    const { text } = useMessages();
    const [picker, setPicker] = useState<PickerTarget | null>(null);
    const [saving, setSaving] = useState(false);
    const [refusal, setRefusal] = useState<Message | null>(null);

    const sources = draft.sources;
    const configured = state.sources !== null;
    const buildRunning = state.build?.status === "running";
    const hasSources = sources.module_source_directory !== null || sources.sample_directories.length > 0;
    const message = footerMessage({
        saving,
        refusal,
        buildRunning,
        hasSources,
        saved: configured && !draft.unsaved,
    });

    function change(edit: (current: LibrarySources) => LibrarySources): void {
        setRefusal(null);
        draft.edit(edit);
    }

    async function handleSave(): Promise<void> {
        setSaving(true);
        setRefusal(null);
        try {
            const saved = await chooseSources(sources);
            onSaved(saved);
            draft.reset(saved.sources ?? sources);
        } catch (error: unknown) {
            setRefusal(failureOf(error));
        } finally {
            setSaving(false);
        }
    }

    const footer = (
        <>
            <SetupMessage message={message} />
            <Button
                variant="primary"
                disabled={!hasSources || saving || buildRunning || (configured && !draft.unsaved)}
                onClick={() => {
                    void handleSave();
                }}
            >
                {text(configured ? M.setup.folders.saveChanges : M.setup.folders.saveAndOpen)}
            </Button>
        </>
    );

    return (
        <>
            <SetupPane title={text(M.setup.folders.title)} titleId="setup-sources-title" footer={footer}>
                <p className="setup-lead">{text(M.setup.folders.lead)}</p>

                <fieldset className="group">
                    <legend>{text(M.setup.folders.modulesLegend)}</legend>
                    <p className="setup-hint">{text(M.setup.folders.modulesHint)}</p>
                    <PathRow
                        path={sources.module_source_directory}
                        placeholder={text(M.setup.folders.noFolder)}
                        onBrowse={() => {
                            setPicker("modules");
                        }}
                        onClear={() => {
                            change((current) => ({ ...current, module_source_directory: null }));
                        }}
                    />
                </fieldset>

                <fieldset className="group">
                    <legend>{text(M.setup.folders.samplesLegend)}</legend>
                    <p className="setup-hint">{text(M.setup.folders.samplesHint)}</p>
                    <ul className="listbox setup-folder-list">
                        {sources.sample_directories.length === 0 && (
                            <li className="listbox-row listbox-empty">
                                <FolderPath path={null} placeholder={text(M.setup.folders.noSampleFolders)} />
                            </li>
                        )}
                        {sources.sample_directories.map((directory) => (
                            <li key={directory} className="listbox-row">
                                <FolderPath path={directory} placeholder="" />
                                <Button
                                    variant="quiet"
                                    icon
                                    aria-label={text(M.setup.folders.remove)}
                                    onClick={() => {
                                        change((current) => ({
                                            ...current,
                                            sample_directories: current.sample_directories.filter(
                                                (existing) => existing !== directory,
                                            ),
                                        }));
                                    }}
                                >
                                    {REMOVE_GLYPH}
                                </Button>
                            </li>
                        ))}
                    </ul>
                    <div className="group-actions">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setPicker("samples");
                            }}
                        >
                            {text(M.setup.folders.addFolder)}
                        </Button>
                    </div>
                    <label className="setup-label">
                        {text(M.setup.folders.exclusionsLabel)}
                        <input
                            type="text"
                            className="field"
                            placeholder={text(M.setup.folders.exclusionsPlaceholder)}
                            value={draft.exclusionsText}
                            onChange={(event) => {
                                setRefusal(null);
                                draft.setExclusionsText(event.target.value);
                            }}
                        />
                    </label>
                    <p className="setup-hint">{text(M.setup.folders.exclusionsHint)}</p>
                </fieldset>

                <fieldset className="group">
                    <legend>{text(M.setup.folders.locationLegend)}</legend>
                    <p className="setup-hint">{text(M.setup.folders.locationHint)}</p>
                    <PathRow
                        path={sources.library_root}
                        placeholder=""
                        onBrowse={() => {
                            setPicker("library");
                        }}
                        onClear={null}
                    />
                </fieldset>
            </SetupPane>

            {picker !== null && (
                <FolderPicker
                    title={text(PICKER_TITLES[picker])}
                    initialPath={picker === "modules" ? sources.module_source_directory : null}
                    onChoose={(path) => {
                        setPicker(null);
                        change((current) => withChosenFolder(current, picker, path));
                    }}
                    onClose={() => {
                        setPicker(null);
                    }}
                />
            )}
        </>
    );
}
