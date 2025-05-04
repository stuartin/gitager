import type { GitOptions } from "@gitager/git-db/types";
import { createAPI } from "./api";
import { createServer } from "./lib/orpc";

export type GitagerOptions = {
    git: GitOptions
    api?: {
        basePath?: `/${string}`
    }
};

export type GitagerApp = ReturnType<typeof gitager>

export function gitager(options: GitagerOptions) {
    const api = createAPI(options)
    return createServer(options, api)
}