import { type Problem, problemFromDetail } from "./problem";

// Kept equal to `API_PREFIX` in `src/sampleserver/app.py`.
const API_PREFIX = "/api";

/** Where a path relative to the API's own root is actually served. */
export function apiUrl(path: string): string {
    return `${API_PREFIX}${path}`;
}

export class ApiError extends Error {
    public readonly status: number;
    /** What the server says went wrong, where its refusal names a problem. */
    public readonly problem: Problem | null;

    constructor(status: number, message: string, problem: Problem | null) {
        super(message);
        this.status = status;
        this.problem = problem;
    }
}

export type WriteMethod = "PATCH" | "PUT" | "POST";

export interface JsonRequest {
    readonly method: WriteMethod;
    /** The JSON body to send, or `null` for a request that carries none. */
    readonly body: unknown;
}

async function readJson<T>(url: string, response: Response): Promise<T> {
    if (!response.ok) {
        const problem = await readProblem(response);
        throw new ApiError(response.status, failureMessage(url, response.status, problem), problem);
    }
    return (await response.json()) as T;
}

/** The problem a refusal names in its `detail`, and `null` where it names none. */
export async function readProblem(response: Response): Promise<Problem | null> {
    const body: unknown = await Promise.resolve()
        .then(() => response.json())
        .catch(() => null);
    return typeof body === "object" && body !== null && "detail" in body ? problemFromDetail(body.detail) : null;
}

function failureMessage(url: string, status: number, problem: Problem | null): string {
    const general = `request to ${url} failed with status ${String(status)}`;
    return problem === null ? general : `${general}: ${problem.code}`;
}

export async function requestJson<T>(path: string): Promise<T> {
    const url = apiUrl(path);
    return readJson<T>(url, await fetch(url));
}

/** Sends a change to the server and reads back what it made of it. */
export async function sendJson<T>(path: string, request: JsonRequest): Promise<T> {
    const init: RequestInit =
        request.body === null
            ? { method: request.method }
            : {
                  method: request.method,
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(request.body),
              };
    const url = apiUrl(path);
    return readJson<T>(url, await fetch(url, init));
}
