import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApiError } from "../../src/api/client";
import { requestJson } from "../../src/api/client";

describe("requestJson", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("returns the parsed JSON body on a successful response", async () => {
        const payload = { greeting: "hello" };
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(payload) }));

        const result = await requestJson<typeof payload>("/greeting");

        expect(result).toEqual(payload);
    });

    it("throws an ApiError carrying the status on a non-ok response", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

        await expect(requestJson("/missing")).rejects.toMatchObject({ status: 404 } satisfies Partial<ApiError>);
    });
});

describe("a refused request", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    function refusedWith(detail: unknown): void {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({ ok: false, status: 422, json: () => Promise.resolve({ detail }) }),
        );
    }

    it("carries the problem the server names", async () => {
        const problem = { code: "folders_overlap", params: { directory: "/a", other: "/a/b" }, reason: null } as const;
        refusedWith(problem);

        await expect(requestJson("/samples/x")).rejects.toMatchObject({ problem } satisfies Partial<ApiError>);
    });

    it.each([
        { name: "plain text", detail: "no such sample" },
        { name: "a list of validation errors", detail: [{ msg: "too short" }] },
        { name: "a code the app does not know", detail: { code: "unheard_of", params: {}, reason: null } },
    ])("carries no problem where the server's detail is $name", async ({ detail }) => {
        refusedWith(detail);

        await expect(requestJson("/samples/x")).rejects.toMatchObject({ problem: null } satisfies Partial<ApiError>);
    });
});
