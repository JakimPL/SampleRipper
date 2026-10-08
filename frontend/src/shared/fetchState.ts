import type { Message } from "../messages/messageIds";

export type FetchState<T> =
    | { readonly status: "loading" }
    | { readonly status: "error"; readonly message: Message }
    | { readonly status: "success"; readonly data: T };
