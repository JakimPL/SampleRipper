import { describe, expect, it } from "vitest";

import { ApiError } from "../../src/api/client";
import { M } from "../../src/messages/messageIds";
import { failureOf } from "../../src/shared/failure";

describe("failureOf", () => {
    it("words the problem an ApiError carries, with its values and reason", () => {
        const problem = {
            code: "folder_unreadable",
            params: { folder: "/music" },
            reason: "Permission denied",
        } as const;

        expect(failureOf(new ApiError(404, "refused", problem))).toEqual({
            id: M.errors.folderUnreadable,
            values: { folder: "/music", reason: "Permission denied" },
        });
    });

    it("names the status of a refusal that carries no problem", () => {
        expect(failureOf(new ApiError(502, "refused", null))).toEqual({
            id: M.errors.requestFailed,
            values: { status: 502 },
        });
    });

    it("tells a failed connection from an unexpected error", () => {
        expect(failureOf(new TypeError("Failed to fetch"))).toEqual({ id: M.errors.unreachable });
        expect(failureOf(new Error("boom"))).toEqual({ id: M.errors.unexpected, values: { reason: "boom" } });
        expect(failureOf("plain text")).toEqual({ id: M.errors.unexpected, values: { reason: "plain text" } });
    });
});
