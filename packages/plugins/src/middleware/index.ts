import { createMiddleware } from "..";
import { type GitDBOptions, createGitDB } from "@gitager/git-db";

export const db = (options: GitDBOptions) => createMiddleware().middleware(async ({ next }) => {
    const db = createGitDB(options);
    await db.init();

    return next({
        context: { db },
    });
})