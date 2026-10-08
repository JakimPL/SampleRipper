import { M, type Message, type MessageId } from "../messages/messageIds";
import type { components } from "./setupSchema";

export type Problem = components["schemas"]["Problem"];
export type MessageCode = Problem["code"];

const CODE_MESSAGES: Readonly<Record<MessageCode, MessageId>> = {
    not_admitted: M.errors.notAdmitted,
    not_found: M.errors.notFound,
    unreadable_audio: M.errors.unreadableAudio,
    morph_unavailable: M.errors.morphUnavailable,
    morph_timed_out: M.errors.morphTimedOut,
    morph_refused: M.errors.morphRefused,
    curation_withheld: M.errors.curationWithheld,
    too_many_requests: M.errors.tooManyRequests,
    too_many_morphs: M.errors.tooManyMorphs,
    morphs_busy: M.errors.morphsBusy,
    library_not_open: M.errors.libraryNotOpen,
    library_in_use: M.errors.libraryInUse,
    library_open_failed: M.errors.libraryOpenFailed,
    public_library_refused: M.errors.publicLibraryRefused,
    save_folders_first: M.errors.saveFoldersFirst,
    build_in_progress: M.errors.buildInProgress,
    build_already_running: M.errors.buildAlreadyRunning,
    build_step_stopped: M.errors.buildStepStopped,
    build_refused: M.errors.buildRefused,
    folder_not_a_folder: M.errors.folderNotAFolder,
    folder_unreadable: M.errors.folderUnreadable,
    folder_not_absolute: M.errors.folderNotAbsolute,
    folders_overlap: M.errors.foldersOverlap,
    exclusion_empty: M.errors.exclusionEmpty,
    settings_invalid: M.errors.settingsInvalid,
    configuration_refused: M.errors.configurationRefused,
};

export function isMessageCode(value: unknown): value is MessageCode {
    return typeof value === "string" && value in CODE_MESSAGES;
}

/** The message that words a problem, with the values its sentence names and the server's technical reason. */
export function messageOfProblem(problem: Problem): Message {
    return { id: CODE_MESSAGES[problem.code], values: { ...problem.params, reason: problem.reason ?? "" } };
}

/** A problem read from a refusal's `detail`, or `null` where the detail names no known code. */
export function problemFromDetail(detail: unknown): Problem | null {
    if (typeof detail !== "object" || detail === null || !("code" in detail) || !isMessageCode(detail.code)) {
        return null;
    }
    const params =
        "params" in detail && typeof detail.params === "object" && detail.params !== null ? detail.params : {};
    const reason = "reason" in detail && typeof detail.reason === "string" ? detail.reason : null;
    return { code: detail.code, params: params as Problem["params"], reason };
}
