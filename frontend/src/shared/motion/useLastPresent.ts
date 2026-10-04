import { useState } from "react";

/**
 * `value` while it is there, and the last value it held while it is `null`: what a closing
 * section goes on showing after the state it showed has gone. `value` keeps its identity from
 * one render to the next for as long as it stands for the same thing, as a memoized value does.
 */
export function useLastPresent<Value>(value: Value | null): Value | null {
    const [last, setLast] = useState<Value | null>(value);
    if (value !== null && value !== last) {
        setLast(value);
    }
    return value ?? last;
}
