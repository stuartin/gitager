import { createAPI } from "./api";
import { createServer } from "./lib/orpc";

export type GitagerOptions = {
    git: {
        url: string;
        branch?: string // defaults to main
        user?: string; // should be oauth2 if using github fine grained tokens
        token: string;
    },
    api?: {
        basePath?: `/${string}`
    }
};

export type GitagerApp = ReturnType<typeof gitager>

export function gitager(options: GitagerOptions) {
    const api = createAPI(options)
    return createServer(options, api)
}