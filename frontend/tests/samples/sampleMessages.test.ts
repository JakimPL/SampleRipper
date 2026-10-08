import { describe, expect, it } from "vitest";

import { M } from "../../src/messages/messageIds";
import { englishText } from "../support/englishMessages";

describe("the listing status", () => {
    it("adds the groups and the loading note only when they apply", () => {
        const plain = { loaded: 3, total: 40, grouped: false, groups: 3, loading: false };

        expect(englishText(M.samples.table.status, plain)).toBe("3 of 40 loaded");
        expect(englishText(M.samples.table.status, { ...plain, grouped: true, loading: true })).toBe(
            "3 of 40 loaded · 3 groups · loading…",
        );
        expect(englishText(M.samples.table.status, { ...plain, grouped: true, groups: 1 })).toBe(
            "3 of 40 loaded · 1 group",
        );
    });
});

describe("a playback rate option", () => {
    it("counts how many times the rate was played", () => {
        expect(englishText(M.samples.player.rateOption, { rateHz: 8363, count: 1 })).toBe("8363 Hz · played 1 time");
        expect(englishText(M.samples.player.rateOption, { rateHz: 44100, count: 2 })).toBe("44100 Hz · played 2 times");
    });
});
