import type { ReactElement } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { LibraryStats } from "../api/stats";
import { M } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { formatBytes } from "../shared/format";

const CHART_HEIGHT_PX = 200;

interface StatsViewProps {
    readonly stats: LibraryStats;
}

export function StatsView({ stats }: StatsViewProps): ReactElement {
    const { text } = useMessages();
    return (
        <section className="stats-grid">
            <div className="stat-tile">
                <div className="big mono">{stats.module_count}</div>
                <div className="label">{text(M.stats.modules)}</div>
            </div>
            <div className="stat-tile">
                <div className="big mono">{stats.sample_count}</div>
                <div className="label">{text(M.stats.samples)}</div>
            </div>
            <div className="stat-tile">
                <div className="big mono">{stats.sample_properties_count}</div>
                <div className="label">{text(M.stats.sampleProperties)}</div>
            </div>
            <div className="stat-tile">
                <div className="big mono">{stats.sample_file_count}</div>
                <div className="label">{text(M.stats.sampleFiles)}</div>
            </div>
            <div className="stat-tile is-wide">
                <div className="big mono">{formatBytes(stats.total_stored_bytes)}</div>
                <div className="label">{text(M.stats.storedAudio)}</div>
            </div>
            <div className="chart-card">
                <h3>{text(M.stats.modulesByTracker)}</h3>
                <ResponsiveContainer width="100%" height={CHART_HEIGHT_PX}>
                    <BarChart data={[...stats.modules_by_tracker]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="tracker" stroke="var(--text-muted)" />
                        <YAxis allowDecimals={false} stroke="var(--text-muted)" />
                        <Tooltip />
                        <Bar dataKey="module_count" name={text(M.stats.modules)} fill="var(--accent)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="chart-card">
                <h3>{text(M.stats.relationsByType)}</h3>
                <ResponsiveContainer width="100%" height={CHART_HEIGHT_PX}>
                    <BarChart data={[...stats.relations_by_type]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="relation_type" stroke="var(--text-muted)" />
                        <YAxis allowDecimals={false} stroke="var(--text-muted)" />
                        <Tooltip />
                        <Bar dataKey="relation_count" name={text(M.stats.relations)} fill="var(--good)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}
