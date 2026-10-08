import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { parse } from "@formatjs/icu-messageformat-parser";
import { describe, expect, it } from "vitest";

import { CATALOG_EN } from "../../src/messages/catalog.en";
import { flattenCatalog } from "../../src/messages/messageIds";

const SOURCE_DIRECTORY = join(import.meta.dirname, "../../src");
const MESSAGES_DIRECTORY = join(SOURCE_DIRECTORY, "messages");

function sourceFiles(directory: string): readonly string[] {
    return readdirSync(directory).flatMap((entry) => {
        const path = join(directory, entry);
        if (path === MESSAGES_DIRECTORY) {
            return [];
        }
        return statSync(path).isDirectory() ? sourceFiles(path) : /\.tsx?$/.test(entry) ? [path] : [];
    });
}

describe("the English catalog", () => {
    const flat = flattenCatalog(CATALOG_EN, "");

    it.each(Object.entries(flat))("%s is a well-formed ICU message", (_id, message) => {
        expect(() => parse(message)).not.toThrow();
    });

    it("has every message used by the source", () => {
        const source = sourceFiles(SOURCE_DIRECTORY)
            .map((path) => readFileSync(path, "utf8"))
            .join("\n");
        const unused = Object.keys(flat).filter((id) => !source.includes(`M.${id}`));
        expect(unused).toEqual([]);
    });
});
