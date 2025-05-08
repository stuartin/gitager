import { createMiddleware } from '..';
import { UNAUTHORIZED } from '../errors';

export const requireAuth = createMiddleware()
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
