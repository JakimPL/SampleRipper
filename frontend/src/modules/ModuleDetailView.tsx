import type { ReactElement } from "react";

import type { ModuleDetail } from "../api/modules";
import { M } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { DetailHeader } from "../shared/DetailHeader";
import { formatBytes } from "../shared/format";
import { Icon } from "../shared/icons/Icon";
import { UNTITLED_MODULE_LABEL } from "../shared/labels";
import { linkHost } from "../shared/linkHost";
import { MODULE_SAMPLE_COLUMN_LABELS, ModuleSampleRow } from "./ModuleSampleRow";

interface ModuleDetailViewProps {
    readonly module: ModuleDetail;
}

export function ModuleDetailView({ module }: ModuleDetailViewProps): ReactElement {
    const { text } = useMessages();
    return (
        <section className="detail-scroll">
            <DetailHeader name={module.title} placeholder={text(UNTITLED_MODULE_LABEL)} hash={module.hash} />
            <dl className="kv">
                <dt>{text(M.modules.fields.filename)}</dt>
                <dd>{module.filename}</dd>
                {module.link !== null && (
                    <>
                        <dt>{text(M.modules.fields.link)}</dt>
                        <dd>
                            <a className="external-link" href={module.link} target="_blank" rel="noreferrer">
                                {linkHost(module.link)}
                                <Icon name="external" label={null} />
                            </a>
                        </dd>
                    </>
                )}
                <dt>{text(M.modules.fields.tracker)}</dt>
                <dd>
                    <span className={`badge badge-${module.tracker}`}>{module.tracker}</span>
                </dd>
                <dt>{text(M.modules.fields.channels)}</dt>
                <dd className="mono">{module.channel_count}</dd>
                <dt>{text(M.modules.fields.patterns)}</dt>
                <dd className="mono">{module.pattern_count}</dd>
                <dt>{text(M.modules.fields.instruments)}</dt>
                <dd className="mono">{module.instrument_count}</dd>
                <dt>{text(M.modules.fields.samples)}</dt>
                <dd className="mono">{module.sample_count}</dd>
                <dt>{text(M.modules.fields.fileSize)}</dt>
                <dd className="mono">{formatBytes(module.file_size)}</dd>
                <dt>{text(M.modules.fields.ingestedAt)}</dt>
                <dd>{new Date(module.ingested_at).toLocaleString()}</dd>
            </dl>
            <div className="detail-section">
                <h3>{text(M.modules.fields.samples)}</h3>
                <table className="mini">
                    <thead>
                        <tr>
                            {Object.values(MODULE_SAMPLE_COLUMN_LABELS).map((label) => (
                                <th key={label}>{text(label)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {module.occurrences.map((occurrence) => (
                            <ModuleSampleRow
                                key={`${String(occurrence.properties.occurrence.instrument_index)}-${String(occurrence.properties.occurrence.sample_slot)}`}
                                occurrence={occurrence}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
