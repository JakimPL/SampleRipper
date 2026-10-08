import type { ReactElement } from "react";

import type { InputMode } from "../layout/layoutMode";
import { M, type MessageId } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { useCurationAccess } from "../samples/useCurationAccess";
import { BottomSheet } from "../shared/overlay/BottomSheet";

interface GuideEntry {
    readonly gesture: MessageId;
    readonly meaning: MessageId;
    /** Shown only where the person here may change labels (true), or only where they may not (false). */
    readonly whenEditing?: boolean;
}

interface GuideSection {
    readonly title: MessageId;
    readonly entries: readonly GuideEntry[];
}

const TOUCH_GUIDE: readonly GuideSection[] = [
    {
        title: M.shell.guide.sections.lists,
        entries: [
            { gesture: M.shell.guide.gestures.tapRow, meaning: M.shell.guide.meanings.selectsSampleAndPlays },
            {
                gesture: M.shell.guide.gestures.holdRow,
                meaning: M.shell.guide.meanings.opensStarsHeartLabel,
                whenEditing: true,
            },
            {
                gesture: M.shell.guide.gestures.holdRow,
                meaning: M.shell.guide.meanings.opensActions,
                whenEditing: false,
            },
            { gesture: M.shell.guide.gestures.tapChevron, meaning: M.shell.guide.meanings.opensAsPage },
            {
                gesture: M.shell.guide.gestures.tapHeart,
                meaning: M.shell.guide.meanings.marksFavorite,
                whenEditing: true,
            },
        ],
    },
    {
        title: M.shell.guide.sections.tray,
        entries: [
            { gesture: M.shell.guide.gestures.tapWaveform, meaning: M.shell.guide.meanings.playsOrPausesSelected },
            {
                gesture: M.shell.guide.gestures.tapStarOrHeart,
                meaning: M.shell.guide.meanings.ratesOrMarksFavorite,
                whenEditing: true,
            },
            { gesture: M.shell.guide.gestures.doubleTapName, meaning: M.shell.guide.meanings.opensAsPageLikeChevron },
        ],
    },
    {
        title: M.shell.guide.sections.page,
        entries: [
            { gesture: M.shell.guide.gestures.tapStepButtons, meaning: M.shell.guide.meanings.stepsOneSample },
            { gesture: M.shell.guide.gestures.tapBack, meaning: M.shell.guide.meanings.returnsToList },
        ],
    },
    {
        title: M.shell.guide.sections.cloud,
        entries: [
            { gesture: M.shell.guide.gestures.tapPoint, meaning: M.shell.guide.meanings.selectsAndPlays },
            { gesture: M.shell.guide.gestures.doubleTapPoint, meaning: M.shell.guide.meanings.opensIt },
            { gesture: M.shell.guide.gestures.tapEmptySpace, meaning: M.shell.guide.meanings.clearsSelectedPoint },
            { gesture: M.shell.guide.gestures.drag, meaning: M.shell.guide.meanings.movesCloud },
            { gesture: M.shell.guide.gestures.pinch, meaning: M.shell.guide.meanings.zoomsAboutFingers },
            { gesture: M.shell.guide.gestures.holdPoint, meaning: M.shell.guide.meanings.opensActions },
            { gesture: M.shell.guide.gestures.useAsAfterHold, meaning: M.shell.guide.meanings.putsAtOtherEnd },
            { gesture: M.shell.guide.gestures.endButtons, meaning: M.shell.guide.meanings.playsEndAndSelectsByTap },
            { gesture: M.shell.guide.gestures.clearEnd, meaning: M.shell.guide.meanings.clearsEndByTap },
            { gesture: M.shell.guide.gestures.morphButton, meaning: M.shell.guide.meanings.togglesMorphByTap },
            { gesture: M.shell.guide.gestures.swapButton, meaning: M.shell.guide.meanings.swapsEnds },
            { gesture: M.shell.guide.gestures.waveformButton, meaning: M.shell.guide.meanings.opensMorphWaveform },
            { gesture: M.shell.guide.gestures.historyButton, meaning: M.shell.guide.meanings.opensHistoryByTap },
            {
                gesture: M.shell.guide.gestures.historyUndoRedoButtons,
                meaning: M.shell.guide.meanings.undoesAndRedoesEnds,
            },
            { gesture: M.shell.guide.gestures.centerButton, meaning: M.shell.guide.meanings.centersOnSelected },
        ],
    },
];

const POINTER_GUIDE: readonly GuideSection[] = [
    {
        title: M.shell.guide.sections.lists,
        entries: [
            { gesture: M.shell.guide.gestures.clickRow, meaning: M.shell.guide.meanings.selectsSample },
            { gesture: M.shell.guide.gestures.doubleClickRow, meaning: M.shell.guide.meanings.opensSampleOrModule },
            { gesture: M.shell.guide.gestures.arrowKeys, meaning: M.shell.guide.meanings.movesBetweenRows },
            { gesture: M.shell.guide.gestures.spaceKey, meaning: M.shell.guide.meanings.playsSample },
            {
                gesture: M.shell.guide.gestures.favoriteKey,
                meaning: M.shell.guide.meanings.marksFavorite,
                whenEditing: true,
            },
            {
                gesture: M.shell.guide.gestures.ratingKeys,
                meaning: M.shell.guide.meanings.ratesSample,
                whenEditing: true,
            },
        ],
    },
    {
        title: M.shell.guide.sections.openSample,
        entries: [{ gesture: M.shell.guide.gestures.stepKeys, meaning: M.shell.guide.meanings.stepsThroughListing }],
    },
    {
        title: M.shell.guide.sections.cloud,
        entries: [
            { gesture: M.shell.guide.gestures.clickPoint, meaning: M.shell.guide.meanings.selectsAndPlays },
            { gesture: M.shell.guide.gestures.doubleClickPoint, meaning: M.shell.guide.meanings.opensIt },
            { gesture: M.shell.guide.gestures.dragAndScroll, meaning: M.shell.guide.meanings.movesAndZoomsCloud },
            { gesture: M.shell.guide.gestures.rightClickPoint, meaning: M.shell.guide.meanings.putsAtOtherEnd },
            { gesture: M.shell.guide.gestures.endButtons, meaning: M.shell.guide.meanings.playsEndAndSelectsByClick },
            { gesture: M.shell.guide.gestures.clearEnd, meaning: M.shell.guide.meanings.clearsEndByClick },
            { gesture: M.shell.guide.gestures.morphButton, meaning: M.shell.guide.meanings.togglesMorphByClick },
            { gesture: M.shell.guide.gestures.swapButton, meaning: M.shell.guide.meanings.swapsEnds },
            { gesture: M.shell.guide.gestures.waveformButton, meaning: M.shell.guide.meanings.opensMorphWaveform },
            { gesture: M.shell.guide.gestures.historyButton, meaning: M.shell.guide.meanings.opensHistoryByClick },
            { gesture: M.shell.guide.gestures.endKeys, meaning: M.shell.guide.meanings.selectsEndAnywhere },
            { gesture: M.shell.guide.gestures.tabKey, meaning: M.shell.guide.meanings.selectsOtherEnd },
            {
                gesture: M.shell.guide.gestures.undoRedoKeys,
                meaning: M.shell.guide.meanings.undoesAndRedoesEndsAnywhere,
            },
            { gesture: M.shell.guide.gestures.escapeKey, meaning: M.shell.guide.meanings.clearsSelectedPoint },
        ],
    },
];

const TITLES: Readonly<Record<InputMode, MessageId>> = {
    touch: M.shell.guide.titles.touch,
    pointer: M.shell.guide.titles.pointer,
};

interface GuideSheetProps {
    readonly input: InputMode;
    readonly onClose: () => void;
}

/** What each gesture, click and key does, worded for the input the person has and what they may change here. */
export function GuideSheet({ input, onClose }: GuideSheetProps): ReactElement {
    const { labelEditing } = useCurationAccess();
    const { text } = useMessages();
    const sections = input === "touch" ? TOUCH_GUIDE : POINTER_GUIDE;
    return (
        <BottomSheet title={text(TITLES[input])} onClose={onClose}>
            {sections.map((section) => (
                <section key={section.title} className="guide-section">
                    <h3 className="guide-title">{text(section.title)}</h3>
                    <dl className="guide">
                        {section.entries
                            .filter((entry) => entry.whenEditing === undefined || entry.whenEditing === labelEditing)
                            .map((entry) => (
                                <div key={entry.meaning} className="guide-entry">
                                    <dt className="guide-gesture">{text(entry.gesture)}</dt>
                                    <dd className="guide-meaning">{text(entry.meaning)}</dd>
                                </div>
                            ))}
                    </dl>
                </section>
            ))}
        </BottomSheet>
    );
}

export const GUIDE_TITLES = TITLES;
