import { ApiError } from "../api/client";
import { messageOfProblem } from "../api/problem";
import { M, type Message } from "../messages/messageIds";

/** What a failed request or a thrown error tells a person: the server's own problem where it gave one. */
export function failureOf(error: unknown): Message {
    if (error instanceof ApiError) {
        return error.problem === null
            ? { id: M.errors.requestFailed, values: { status: error.status } }
            : messageOfProblem(error.problem);
    }
    if (error instanceof TypeError) {
        return { id: M.errors.unreachable };
    }
    return { id: M.errors.unexpected, values: { reason: error instanceof Error ? error.message : String(error) } };
}
