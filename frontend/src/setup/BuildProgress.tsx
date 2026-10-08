import type { ReactElement } from "react";

import type { BuildStep, BuildView, StepState } from "../api/setup";
import { M, type MessageId } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { Button } from "../shared/controls/Button";
import { buttonClassName } from "../shared/controls/buttonClassName";
import { SetupMessage } from "./SetupMessage";
import { stepMessageId } from "./stepNames";
import {
    describeElapsed,
    describeEstimate,
    estimateRemainingSeconds,
    secondsBetween,
    type TextFormatter,
    useClock,
} from "./timing";

interface BuildProgressProps {
    readonly build: BuildView | null;
    readonly onCancel: () => void;
}

const STEP_MARKS: Readonly<Record<StepState, string>> = {
    waiting: "○",
    "up to date": "✓",
    running: "◐",
    done: "✓",
    failed: "✕",
    skipped: "–",
};
const STEP_NOTES: Readonly<Record<StepState, MessageId>> = {
    waiting: M.setup.progress.notes.waiting,
    "up to date": M.setup.progress.notes.alreadyCurrent,
    running: M.setup.progress.notes.running,
    done: M.setup.progress.notes.done,
    failed: M.setup.progress.notes.failed,
    skipped: M.setup.progress.notes.skipped,
};
const BUILD_HEADINGS: Readonly<Record<BuildView["status"], MessageId>> = {
    running: M.setup.progress.headings.running,
    completed: M.setup.progress.headings.completed,
    failed: M.setup.progress.headings.failed,
    canceled: M.setup.progress.headings.canceled,
};

function stepName(step: string, text: TextFormatter): string {
    const id = stepMessageId(step);
    return id === null ? step : text(id);
}

/** "Step 3 of 12": the first step still running or waiting, counted among all; null before the run lists its steps. */
function stepPosition(steps: readonly BuildStep[], text: TextFormatter): string | null {
    if (steps.length === 0) {
        return null;
    }
    const current = steps.findIndex((step) => step.state === "running" || step.state === "waiting");
    const position = current === -1 ? steps.length : current + 1;
    return text(M.setup.progress.position, { position, total: steps.length });
}

function describeBuildTimes(build: BuildView, now: number, text: TextFormatter): string {
    if (build.status === "running") {
        return text(M.setup.progress.started, {
            startedAt: new Date(build.started_at),
            elapsed: describeElapsed(secondsBetween(build.started_at, now), text),
        });
    }
    return build.ended_at === null
        ? ""
        : text(M.setup.progress.took, {
              duration: describeElapsed(secondsBetween(build.started_at, build.ended_at), text),
          });
}

function describeRunningStep(step: BuildStep, now: number, text: TextFormatter): string {
    const progress = step.progress;
    if (progress !== null) {
        const counts = { done: progress.done, total: progress.total };
        const remaining = estimateRemainingSeconds(progress);
        return remaining === null
            ? text(M.setup.progress.count, counts)
            : text(M.setup.progress.countWithEstimate, { ...counts, estimate: describeEstimate(remaining, text) });
    }
    return step.started_at === null
        ? text(STEP_NOTES.running)
        : text(M.setup.progress.notes.runningFor, {
              duration: describeElapsed(secondsBetween(step.started_at, now), text),
          });
}

function describeStep(step: BuildStep, now: number, text: TextFormatter): string {
    switch (step.state) {
        case "running":
            return describeRunningStep(step, now, text);
        case "done":
            return step.started_at !== null && step.ended_at !== null
                ? text(M.setup.progress.notes.doneIn, {
                      duration: describeElapsed(secondsBetween(step.started_at, step.ended_at), text),
                  })
                : text(STEP_NOTES.done);
        case "waiting":
        case "up to date":
        case "failed":
        case "skipped":
            return text(STEP_NOTES[step.state]);
    }
}

function StepRow({ step, now }: { readonly step: BuildStep; readonly now: number }): ReactElement {
    const { text } = useMessages();
    const progress = step.progress;
    const fraction = progress !== null && progress.total > 0 ? progress.done / progress.total : undefined;
    return (
        <li className="listbox-row build-step" data-state={step.state}>
            <span className="build-step-mark" aria-hidden>
                {STEP_MARKS[step.state]}
            </span>
            <span className="build-step-name">{stepName(step.name, text)}</span>
            <span className="build-step-note">{describeStep(step, now, text)}</span>
            {step.state === "running" && (
                <progress
                    className="progress build-step-bar"
                    value={fraction}
                    max={1}
                    aria-label={progress?.label ?? stepName(step.name, text)}
                />
            )}
        </li>
    );
}

/**
 * The Progress group: the latest build as it runs, with its heading, which step it is on and a way
 * to cancel it on one row of fixed height, how long it has taken, and every step with its time, the
 * running one with its count, estimate and bar. The end of the log opens under a build that
 * stopped, and the group says where builds show before any has started.
 */
export function BuildProgress({ build, onCancel }: BuildProgressProps): ReactElement {
    const { text } = useMessages();
    const running = build?.status === "running";
    const now = useClock(running);

    return (
        <fieldset className="group build-progress">
            <legend>{text(M.setup.progress.legend)}</legend>
            {build === null ? (
                <p className="build-placeholder setup-hint">{text(M.setup.progress.placeholder)}</p>
            ) : (
                <>
                    <div className="build-progress-heading">
                        <h3 className="build-progress-title">{text(BUILD_HEADINGS[build.status])}</h3>
                        <span className="build-progress-position">
                            {running ? stepPosition(build.steps, text) : null}
                        </span>
                        {running && (
                            <Button variant="secondary" onClick={onCancel}>
                                {text(M.shared.cancel)}
                            </Button>
                        )}
                    </div>
                    <p className="build-progress-times setup-hint">{describeBuildTimes(build, now, text)}</p>
                    <ol className="listbox build-steps">
                        {build.steps.map((step) => (
                            <StepRow key={step.name} step={step} now={now} />
                        ))}
                        {build.steps.length === 0 && (
                            <li className="listbox-row listbox-empty">{text(M.setup.progress.gettingReady)}</li>
                        )}
                    </ol>
                    {build.problem !== null && <SetupMessage message={{ content: build.problem, tone: "error" }} />}
                    {build.status === "failed" && build.log_tail.length > 0 && (
                        <details className="build-log">
                            <summary className={buttonClassName({ variant: "quiet" })}>
                                {text(M.setup.progress.showDetails)}
                            </summary>
                            <pre className="mono">{build.log_tail.join("\n")}</pre>
                        </details>
                    )}
                </>
            )}
        </fieldset>
    );
}
