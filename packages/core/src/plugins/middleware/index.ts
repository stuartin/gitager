import { createMiddleware } from "..";
import { type GitDBOptions, createGitDB } from "@gitager/git-db";
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "../../lib/orpc/errors";
import type { z } from "zod";


export const gitDB = <TSchema extends z.ZodTypeAny>(options: Omit<GitDBOptions<TSchema>, 'git'>) => createMiddleware()
    .errors({
        INTERNAL_SERVER_ERROR
    })
    .middleware(async ({ next, context }) => {
        const db = createGitDB<TSchema>({
            git: context.options.git,
            ...options
        });
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
