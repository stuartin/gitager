import { createMiddleware } from "..";
import { type GitDBOptions, createGitDB } from "@gitager/git-db";
import { UNAUTHORIZED } from "../../lib/orpc/errors";


export const db = (options: GitDBOptions) => createMiddleware().middleware(async ({ next }) => {
    const db = createGitDB(options);
    await db.init();

    return next({
        context: { db },
    });
})


export const requireAuth = () => createMiddleware()
    .errors({
        UNAUTHORIZED,
    })
    .middleware(async ({ next, errors }) => {
        const authSession = {
            session: undefined,
            user: true, // TODO
        };

        if (!authSession?.user)
            throw errors.UNAUTHORIZED();

        return next({
            context: {
                session: authSession.session,
                user: authSession.user,
            },
        });
    });
