import type { GitOptions } from "@gitager/git-db/types";
import { createAPI } from "./api";
import { createServer } from "./lib/orpc";
import type { BluePrint } from "./api/core/blueprints/blueprints.contract";

export type GitagerOptions = {
    git: GitOptions
    api?: {
        basePath?: `/${string}`
    }
    blueprints?: BluePrint[]
};

export type GitagerApp = ReturnType<typeof gitager>

export function gitager(options: GitagerOptions) {
    const api = createAPI(options)
    return createServer(options, api)
}