import type { ReactElement } from "react";

import { type CloudDots, useCloudDotsStore } from "../cloud/cloudDotsStore";
import { drawsFloat, type FloatRenderingSupport } from "../cloud/floatRendering";
import type { InputMode, LayoutMode } from "../layout/layoutMode";
import { useLayoutMode } from "../layout/useLayoutMode";
import { M, type Message, type MessageId } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { BottomSheet } from "../shared/overlay/BottomSheet";

export const DIAGNOSTICS_TITLE = M.shell.diagnostics.title;

interface DiagnosticsSheetProps {
    readonly support: FloatRenderingSupport;
    readonly onClose: () => void;
}

interface Fact {
    readonly name: MessageId;
    readonly value: Message | string;
}

interface DotsChoice {
    readonly dots: CloudDots;
    readonly label: MessageId;
}

const DOTS_CHOICES: readonly DotsChoice[] = [
    { dots: "auto", label: M.shell.diagnostics.dotsAuto },
    { dots: "plain", label: M.shell.diagnostics.dotsPlain },
];

function yesOrNo(supported: boolean): Message {
    return { id: supported ? M.shell.diagnostics.yes : M.shell.diagnostics.no };
}

/** How the cloud's points draw here, in one line. */
function cloudPointsFact(support: FloatRenderingSupport): Message {
    if (!support.webgl) {
        return { id: M.shell.diagnostics.pointsNeedWebgl };
    }
    return {
        id: drawsFloat(support) ? M.shell.diagnostics.pointsByScatterplot : M.shell.diagnostics.pointsPlainFallback,
    };
}

function webglFact(support: FloatRenderingSupport): Message | string {
    if (!support.webgl) {
        return { id: M.shell.diagnostics.webglUnavailable };
    }
    return support.renderer ?? { id: M.shell.diagnostics.webglAvailable };
}

function factsOf(support: FloatRenderingSupport, layout: LayoutMode, input: InputMode): readonly Fact[] {
    return [
        { name: M.shell.diagnostics.facts.browser, value: navigator.userAgent },
        {
            name: M.shell.diagnostics.facts.screen,
            value: {
                id: M.shell.diagnostics.screenSize,
                values: {
                    width: String(window.innerWidth),
                    height: String(window.innerHeight),
                    ratio: String(window.devicePixelRatio),
                },
            },
        },
        { name: M.shell.diagnostics.facts.layout, value: `${layout}, ${input}` },
        { name: M.shell.diagnostics.facts.webgl, value: webglFact(support) },
        { name: M.shell.diagnostics.facts.floatTextures, value: yesOrNo(support.textureFloat) },
        { name: M.shell.diagnostics.facts.floatColorBuffers, value: yesOrNo(support.colorBufferFloat) },
        { name: M.shell.diagnostics.facts.floatBlending, value: yesOrNo(support.floatBlend) },
        { name: M.shell.diagnostics.facts.cloudPoints, value: cloudPointsFact(support) },
    ];
}

/**
 * What this browser gives the app, readable on a phone with no console: the screen and the layout,
 * what its WebGL supports and how the cloud's points draw as a result, with the choice to draw
 * them as plain dots regardless.
 */
export function DiagnosticsSheet({ support, onClose }: DiagnosticsSheetProps): ReactElement {
    const { text, textOf } = useMessages();
    const { layout, input } = useLayoutMode();
    const dots = useCloudDotsStore((state) => state.dots);
    const setDots = useCloudDotsStore((state) => state.setDots);

    return (
        <BottomSheet title={text(DIAGNOSTICS_TITLE)} onClose={onClose}>
            <dl className="fact-list">
                {factsOf(support, layout, input).map((fact) => (
                    <div key={fact.name} className="fact">
                        <dt className="fact-name">{text(fact.name)}</dt>
                        <dd className="fact-value">
                            {typeof fact.value === "string" ? fact.value : textOf(fact.value)}
                        </dd>
                    </div>
                ))}
            </dl>
            <fieldset className="diagnostics-choice">
                <legend>{text(M.shell.diagnostics.drawThePoints)}</legend>
                {DOTS_CHOICES.map((choice) => (
                    <label key={choice.dots}>
                        <input
                            type="radio"
                            name="cloud-dots"
                            value={choice.dots}
                            checked={dots === choice.dots}
                            onChange={() => {
                                setDots(choice.dots);
                            }}
                        />
                        {text(choice.label)}
                    </label>
                ))}
            </fieldset>
        </BottomSheet>
    );
}
