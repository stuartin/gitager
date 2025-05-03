import { orgs } from "./api/routes/orgs";
import { factory } from "./api";

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

export function gitager(options: GitagerOptions) {
    const f = factory(options)
    const app = f.createApp()

    app.basePath(options.api?.basePath || '/api')
        .route("/", orgs(f))

    return app
}