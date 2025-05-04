import { UNAUTHORIZED } from "../errors";
import { createMiddleware } from "..";

export const requireAuth = createMiddleware()
    .errors({
        UNAUTHORIZED,
    })
    .middleware(async ({ context, next, errors }) => {
        const authSession = {
            session: undefined,
            user: true
        }

        if (!authSession?.user)
            throw errors.UNAUTHORIZED();

        return next({
            context: {
                session: authSession.session,
                user: authSession.user,
            },
        });
    });