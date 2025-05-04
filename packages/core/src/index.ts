import type { GitOptions } from "@gitager/git-db/types";
import { createAPI } from "./api";
import { createServer } from "./lib/orpc";
import type { BluePrint } from "./api/core/blueprints/blueprints.contract";
import { createBree } from "./lib/bree";

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
    return {
        server: createServer(options, api),
        jobs: createBree([])
    }
}