import { createFactory } from "hono/factory"
import { logger } from "hono/logger"
import type { GitagerOptions } from ".."

export type ApiEnv = {
    Variables: {
        options: GitagerOptions
    }
}

export type GitagerFactory = ReturnType<typeof factory>

export function factory(options: GitagerOptions) {
    return createFactory<ApiEnv>({
        initApp: (app) => {
            // initialie middleware
            app.use(logger())
            app.use(async (c, next) => {
                c.set('options', options)
                await next()
            })

            // initialize base routes
            app.get("/", (c) => {
                return c.text('welcome to gitager')
            })
        },
    })
}