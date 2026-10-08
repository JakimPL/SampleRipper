import { CATALOG_EN } from "./catalog.en";

type Catalog = Readonly<{ [key: string]: string | Catalog }>;

type Ids<Tree extends Catalog, Prefix extends string = ""> = {
    readonly [Key in keyof Tree & string]: Tree[Key] extends Catalog
        ? Ids<Tree[Key], `${Prefix}${Key}.`>
        : `${Prefix}${Key}`;
};

type Leaves<Tree> = Tree extends string ? Tree : { [Key in keyof Tree]: Leaves<Tree[Key]> }[keyof Tree];

export type MessageId = Leaves<Ids<typeof CATALOG_EN>>;

export type MessageValue = string | number | boolean | Date | null | undefined;

export type MessageValues = Readonly<Record<string, MessageValue>>;

export interface Message {
    readonly id: MessageId;
    readonly values?: MessageValues;
}

function idsOf<Tree extends Catalog>(tree: Tree, prefix: string): Ids<Tree> {
    const entries = Object.entries(tree).map(([key, node]) => [
        key,
        typeof node === "string" ? `${prefix}${key}` : idsOf(node, `${prefix}${key}.`),
    ]);
    return Object.fromEntries(entries) as Ids<Tree>;
}

export function flattenCatalog(tree: Catalog, prefix: string): Readonly<Record<string, string>> {
    return Object.fromEntries(
        Object.entries(tree).flatMap(([key, node]) =>
            typeof node === "string"
                ? [[`${prefix}${key}`, node]]
                : Object.entries(flattenCatalog(node, `${prefix}${key}.`)),
        ),
    );
}

export const M = idsOf(CATALOG_EN, "");
