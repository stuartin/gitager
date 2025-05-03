import { createFactory } from "hono/factory";
import { logger } from "hono/logger";
import { gitRoute } from "./api/routes/git";
import { Git } from "./controllers/git";


export type GitagerConfig = {
    gitUrl: string;
    gitUser?: string; // should be oauth2 if using github fine grained tokens
    gitToken: string;
    basePath?: string
};

type Env = {
    Variables: {
        config: GitagerConfig
        git: Git
    }
}

export type GitagerFactory = ReturnType<typeof init>

function init(config: GitagerConfig) {

    try {

        const git = new Git(config)
        git.init()

        return createFactory<Env>({
            initApp: (app) => {

                // initialie middleware
                app.use(logger())
                app.use(async (c, next) => {
                    c.set('config', config)
                    c.set('git', git)
                    await next()
                })

                // initialize base routes
                app.get("/", (c) => {
                    return c.text('welcome to gitager')
                })
            },
        })

    } catch (error) {
        console.error(error)
    }
}

export function gitager(options: GitagerConfig) {

    const factory = init(options)
    if (!factory) throw new Error("Could not connect to git url.")


    const app = factory.createApp()
    app.basePath(options.basePath || '/api')
        .route("/git", gitRoute(factory))

    return app
}