import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useLastPresent } from "../../../src/shared/motion/useLastPresent";

interface Item {
    readonly name: string;
}

interface HookProps {
    readonly value: Item | null;
}

const FIRST: Item = { name: "first" };
const SECOND: Item = { name: "second" };

describe("useLastPresent", () => {
    it("reads null before any value has come", () => {
        const { result } = renderHook(() => useLastPresent<Item>(null));

        expect(result.current).toBeNull();
    });

    it("follows the value while it is there, and holds the last one once it is gone", () => {
        const { result, rerender } = renderHook<Item | null, HookProps>(({ value }) => useLastPresent(value), {
            initialProps: { value: FIRST },
        });
        expect(result.current).toBe(FIRST);

        rerender({ value: SECOND });
        expect(result.current).toBe(SECOND);

        rerender({ value: null });
        expect(result.current).toBe(SECOND);
    });
});
