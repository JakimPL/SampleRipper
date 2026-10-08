import type { ReactElement } from "react";
import { Link } from "react-router-dom";

import type { SampleRelation } from "../api/samples";
import { M, type MessageId } from "../messages/messageIds";
import { useMessages } from "../messages/useMessages";
import { classNames } from "../shared/classNames";
import { RowOpenLink } from "../workspace/RowOpenLink";
import { useEntityRowInteractions } from "../workspace/useEntityRowInteractions";

const CONFIDENCE_DECIMAL_PLACES = 2;

/** The columns of the relations table, as its header and its stacked rows both name them. */
export const RELATION_COLUMN_LABELS = {
    sample: M.samples.columns.sample,
    type: M.samples.columns.type,
    confidence: M.samples.columns.confidence,
    method: M.samples.columns.method,
    reviewed: M.samples.columns.reviewed,
} as const;

function describeReviewStatus(review: SampleRelation["review"]): MessageId {
    if (!review) {
        return M.samples.review.unreviewed;
    }

    return review.confirmed ? M.samples.review.confirmed : M.samples.review.rejected;
}

interface SampleRelationRowProps {
    readonly relation: SampleRelation;
    readonly subjectHash: string;
}

export function SampleRelationRow({ relation, subjectHash }: SampleRelationRowProps): ReactElement {
    const { text } = useMessages();
    const otherHash = relation.subject_hash === subjectHash ? relation.reference_hash : relation.subject_hash;
    const { href, isHighlighted, isFocused, onClick, onDoubleClick } = useEntityRowInteractions({
        kind: "sample",
        hash: otherHash,
    });

    return (
        <tr
            className={classNames(isHighlighted && "is-highlighted", isFocused && "is-focused")}
            onClickCapture={onClick}
            onDoubleClick={onDoubleClick}
        >
            <td className="cell-name" data-label={text(RELATION_COLUMN_LABELS.sample)}>
                <Link to={href} className="cell-primary mono">
                    {otherHash}
                </Link>
                <RowOpenLink href={href} label={text(M.samples.openSample)} />
            </td>
            <td data-label={text(RELATION_COLUMN_LABELS.type)}>
                <span className={`badge badge-${relation.relation_type}`}>{relation.relation_type}</span>
            </td>
            <td className="mono" data-label={text(RELATION_COLUMN_LABELS.confidence)}>
                {relation.confidence.toFixed(CONFIDENCE_DECIMAL_PLACES)}
            </td>
            <td className="cell-muted" data-label={text(RELATION_COLUMN_LABELS.method)}>
                {relation.method}
            </td>
            <td className="cell-muted" data-label={text(RELATION_COLUMN_LABELS.reviewed)}>
                {text(describeReviewStatus(relation.review))}
            </td>
        </tr>
    );
}
