import { createFactory } from "hono/factory";
import { logger } from "hono/logger";
import { gitRoute } from "./api/routes/git";

type GitagerConfig = {
    gitUrl: string;
    gitToken: string;
    basePath?: string
};

type Env = {
    Variables: {
        config: GitagerConfig
        fs: string
        git: string
    }
}

export type GitagerFactory = ReturnType<typeof init>

function init(options: GitagerConfig) {
    return createFactory<Env>({
        initApp: (app) => {

            // initialie middleware
            app.use(logger())
            app.use(async (c, next) => {
                c.set('config', options)
                c.set('fs', "TODO")
                c.set('git', "TODO")
                await next()
            })

            // initialize base routes
            app.get("/", (c) => {
                return c.text('welcome to gitager')
            })
        },
    })
}

export function gitager(options: GitagerConfig) {

    const factory = init(options)
    const app = factory.createApp()

    app.basePath(options.basePath || '/api')
        .route("/git", gitRoute(factory))

    return app
}