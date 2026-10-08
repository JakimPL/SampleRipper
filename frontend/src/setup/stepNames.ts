import { M, type MessageId } from "../messages/messageIds";

/** Each pipeline step's message on the build's checklist; a step missing here shows its own name. */
const STEP_NAMES: Readonly<Record<string, MessageId>> = {
    labels: M.setup.steps.labels,
    modules: M.setup.steps.modules,
    "sample-files": M.setup.steps.sampleFiles,
    notes: M.setup.steps.notes,
    thumbnails: M.setup.steps.thumbnails,
    equivalence: M.setup.steps.equivalence,
    relink: M.setup.steps.relink,
    teacher: M.setup.steps.teacher,
    "hearing-teacher": M.setup.steps.hearingTeacher,
    categories: M.setup.steps.categories,
    "grid-cache": M.setup.steps.gridCache,
    descriptor: M.setup.steps.descriptor,
    embedding: M.setup.steps.embedding,
    completion: M.setup.steps.completion,
    evaluation: M.setup.steps.evaluation,
    "module-evaluation": M.setup.steps.moduleEvaluation,
    cloud: M.setup.steps.cloud,
    "module-cloud": M.setup.steps.moduleCloud,
};

export function stepMessageId(step: string): MessageId | null {
    return STEP_NAMES[step] ?? null;
}
