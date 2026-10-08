import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import { M } from "../../messages/messageIds";
import { useMessages } from "../../messages/useMessages";
import { ModuleGlance } from "../../modules/ModuleGlance";
import { useModule } from "../../modules/useModule";
import { SampleGlance } from "../../samples/SampleGlance";
import { useSamplePreview } from "../../samples/useSamplePreview";
import type { EntityRef } from "../selectionStore";
import { entityRoute } from "../useEntityRowInteractions";

interface CloudTapCardProps {
    readonly entity: EntityRef;
}

function SampleGlanceOf({ hash }: { readonly hash: string }): ReactElement | null {
    const state = useSamplePreview(hash);
    return state.status === "success" ? <SampleGlance hash={hash} preview={state.data} /> : null;
}

function ModuleGlanceOf({ hash }: { readonly hash: string }): ReactElement | null {
    const state = useModule(hash);
    return state.status === "success" ? <ModuleGlance hash={hash} module={state.data} /> : null;
}

/**
 * What a finger sees of the point it tapped, in place of the tooltip a mouse hovers: the entity at
 * a glance with the way to open it. It rests along the bottom edge of the cloud, clear of the
 * point itself.
 */
export function CloudTapCard({ entity }: CloudTapCardProps): ReactElement {
    const { text } = useMessages();
    return (
        <div className="cloud-tap-card" role="region" aria-label={text(M.workspace.tapCard.region)}>
            <div className="cloud-tap-card-row">
                {entity.kind === "sample" ? (
                    <SampleGlanceOf hash={entity.hash} />
                ) : (
                    <ModuleGlanceOf hash={entity.hash} />
                )}
                <Link
                    to={entityRoute(entity)}
                    className="cloud-tap-card-open"
                    aria-label={text(entity.kind === "sample" ? M.samples.openSample : M.modules.open)}
                >
                    ›
                </Link>
            </div>
        </div>
    );
}
