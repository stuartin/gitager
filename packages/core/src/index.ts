import { factory } from "./api";
import { orgs } from "./api/features/orgs.api";

export type GitagerOptions = {
    git: {
        url: string;
        user?: string; // should be oauth2 if using github fine grained tokens
        token: string;
    }
    api?: {
        basePath?: string
    }
};

export type GitagerApp = ReturnType<typeof gitager>

export function gitager(options: GitagerOptions) {
    const f = factory(options)
    const app = f.createApp()

    app
        .basePath(options.api?.basePath || '/api')
        .route("/", orgs(f))

    return app
}