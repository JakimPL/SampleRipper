import { describe, expect, it } from "vitest";

import { hintFor, type HintId } from "../../src/shared/hints";
import { englishText } from "../support/englishMessages";

const HINT_IDS: readonly HintId[] = ["noSample", "noModule", "noWaveform"];

describe("hintFor", () => {
    it.each(HINT_IDS)("words %s separately for a pointer and for touch", (id) => {
        expect(hintFor(id, "pointer")).not.toBe(hintFor(id, "touch"));
    });

    it.each(HINT_IDS)("keeps pointer gestures out of the touch wording of %s", (id) => {
        expect(englishText(hintFor(id, "touch"))).not.toMatch(/double-click|right-drag|Shift-click/i);
    });
});
