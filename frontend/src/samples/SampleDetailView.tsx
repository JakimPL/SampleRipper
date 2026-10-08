import type { ReactElement } from "react";

import type { SampleDetail, SampleRelation, SimilarSample } from "../api/samples";
import { M, type MessageId } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { Button } from "../shared/controls/Button";
import { DetailHeader } from "../shared/DetailHeader";
import { formatBytes, formatDuration } from "../shared/format";
import { UNNAMED_SAMPLE_LABEL } from "../shared/labels";
import { AnnotationRows } from "./AnnotationRows";
import { FILE_COLUMN_LABELS, SampleFileRow } from "./SampleFileRow";
import { OCCURRENCE_COLUMN_LABELS, SampleOccurrenceRow } from "./SampleOccurrenceRow";
import { RELATION_COLUMN_LABELS, SampleRelationRow } from "./SampleRelationRow";
import { SIMILAR_COLUMN_LABELS, SimilarSampleRow } from "./SimilarSampleRow";
import { useCurationAccess } from "./useCurationAccess";

export type DetailTab = "info" | "similar" | "occurrences" | "relations" | "cooccurrence";

interface SampleDetailViewProps {
    readonly sample: SampleDetail;
    readonly relations: readonly SampleRelation[];
    readonly similar: readonly SimilarSample[];
    readonly tab: DetailTab;
    readonly onTabChange: (tab: DetailTab) => void;
}

interface DetailTabChoice {
    readonly id: DetailTab;
    readonly label: MessageId;
    readonly count?: number;
}

function HeaderRow({ labels }: { readonly labels: Readonly<Record<string, MessageId>> }): ReactElement {
    const { text } = useMessages();
    return (
        <tr>
            {Object.values(labels).map((label) => (
                <th key={label}>{text(label)}</th>
            ))}
        </tr>
    );
}

function ModuleOccurrencesTable({ sample }: { readonly sample: SampleDetail }): ReactElement {
    return (
        <table className="mini">
            <thead>
                <HeaderRow labels={OCCURRENCE_COLUMN_LABELS} />
            </thead>
            <tbody>
                {sample.occurrences.map((occurrence) => (
                    <SampleOccurrenceRow
                        key={`${occurrence.module.hash}-${String(occurrence.properties.occurrence.instrument_index)}-${String(occurrence.properties.occurrence.sample_slot)}`}
                        occurrence={occurrence}
                    />
                ))}
            </tbody>
        </table>
    );
}

function SampleFilesTable({ sample }: { readonly sample: SampleDetail }): ReactElement {
    return (
        <table className="mini">
            <thead>
                <HeaderRow labels={FILE_COLUMN_LABELS} />
            </thead>
            <tbody>
                {sample.files.map((sampleFile) => (
                    <SampleFileRow
                        key={`${sampleFile.directory}/${sampleFile.relative_path}`}
                        sampleFile={sampleFile}
                    />
                ))}
            </tbody>
        </table>
    );
}

/** Every place the sample was found: the module slots holding it, then the files of sample directories. */
function OccurrencesSection({ sample }: { readonly sample: SampleDetail }): ReactElement {
    const { text } = useMessages();
    if (sample.occurrences.length === 0 && sample.files.length === 0) {
        return <p className="placeholder-box">{text(M.samples.detail.noOccurrences)}</p>;
    }
    return (
        <>
            {sample.occurrences.length > 0 && <ModuleOccurrencesTable sample={sample} />}
            {sample.files.length > 0 && <SampleFilesTable sample={sample} />}
        </>
    );
}

function RelationsSection({
    sample,
    relations,
}: {
    readonly sample: SampleDetail;
    readonly relations: readonly SampleRelation[];
}): ReactElement {
    const { text } = useMessages();
    if (relations.length === 0) {
        return <p className="placeholder-box">{text(M.samples.detail.noRelations)}</p>;
    }
    return (
        <table className="mini">
            <thead>
                <HeaderRow labels={RELATION_COLUMN_LABELS} />
            </thead>
            <tbody>
                {relations.map((relation) => (
                    <SampleRelationRow key={relation.id} relation={relation} subjectHash={sample.hash} />
                ))}
            </tbody>
        </table>
    );
}

function SimilarSection({ similar }: { readonly similar: readonly SimilarSample[] }): ReactElement {
    const { text } = useMessages();
    if (similar.length === 0) {
        return <p className="placeholder-box">{text(M.samples.detail.noSimilar)}</p>;
    }
    return (
        <table className="mini is-columnar">
            <thead>
                <HeaderRow labels={SIMILAR_COLUMN_LABELS} />
            </thead>
            <tbody>
                {similar.map((neighbor) => (
                    <SimilarSampleRow key={neighbor.hash} similar={neighbor} />
                ))}
            </tbody>
        </table>
    );
}

function CooccurrenceSection(): ReactElement {
    const { text } = useMessages();
    return <p className="placeholder-box">{text(M.samples.detail.awaitsCooccurrence)}</p>;
}

/** The sample's own facts: its label and what is decided about it, the categories heard in it, and the properties of its audio. */
function InfoSection({ sample }: { readonly sample: SampleDetail }): ReactElement {
    const { text } = useMessages();
    const { curationShown } = useCurationAccess();
    return (
        <dl className="kv">
            {curationShown && <AnnotationRows key={sample.hash} sample={sample} />}
            <dt>{text(M.samples.detail.size)}</dt>
            <dd className="mono">{formatBytes(sample.size_bytes)}</dd>
            <dt>{text(M.samples.detail.duration)}</dt>
            <dd className="mono">{formatDuration(sample.duration_seconds)}</dd>
            <dt>{text(M.samples.detail.depth)}</dt>
            <dd className="mono">{text(M.samples.bitDepth, { depth: sample.depth })}</dd>
            <dt>{text(M.samples.detail.channels)}</dt>
            <dd className="mono">{sample.channels}</dd>
            <dt>{text(M.samples.detail.frames)}</dt>
            <dd className="mono">{sample.frames}</dd>
        </dl>
    );
}

/**
 * One sample in full: its name and identity above, and beneath them one view at a time, chosen by
 * a tab: the sample's own facts, or one of four listings, each tab carrying its count. The tab is
 * the caller's, so the choice outlives the sample in view: a person walking a sample's neighbors
 * keeps seeing neighbors.
 */
export function SampleDetailView({
    sample,
    relations,
    similar,
    tab,
    onTabChange,
}: SampleDetailViewProps): ReactElement {
    const { text } = useMessages();
    const choices: readonly DetailTabChoice[] = [
        { id: "info", label: M.samples.detail.tabInfo },
        { id: "similar", label: M.samples.detail.tabSimilar, count: similar.length },
        {
            id: "occurrences",
            label: M.samples.detail.tabOccurrences,
            count: sample.occurrences.length + sample.files.length,
        },
        { id: "relations", label: M.samples.detail.tabRelations, count: relations.length },
        { id: "cooccurrence", label: M.samples.detail.tabCooccurrence },
    ];

    function section(): ReactElement {
        switch (tab) {
            case "info":
                return <InfoSection sample={sample} />;
            case "occurrences":
                return <OccurrencesSection sample={sample} />;
            case "relations":
                return <RelationsSection sample={sample} relations={relations} />;
            case "similar":
                return <SimilarSection similar={similar} />;
            case "cooccurrence":
                return <CooccurrenceSection />;
        }
    }

    return (
        <section className="detail-scroll">
            <DetailHeader name={sample.display_name} placeholder={text(UNNAMED_SAMPLE_LABEL)} hash={sample.hash} />
            <div className="detail-tabs">
                {choices.map((choice) => (
                    <Button
                        key={choice.id}
                        variant="secondary"
                        aria-pressed={tab === choice.id}
                        onClick={() => {
                            onTabChange(choice.id);
                        }}
                    >
                        {text(choice.label, { count: choice.count })}
                    </Button>
                ))}
            </div>
            <div className="detail-section">{section()}</div>
        </section>
    );
}
