import { GitDB } from '@gitager/git-db/db';
import { createRouter } from '../../../lib/orpc';
import { requireAuth } from '../../../lib/orpc/middleware/require-auth';
import { servicesContract, ServicesSchema } from './services.contract';

const os = createRouter(servicesContract)
    .use(async ({ context, next }) => {
        const db = new GitDB("/core", "/services", ServicesSchema, context.options.git)
        await db.init()

        return next({
            context: { db }
        })
    })

export const servicesRouter = os
    .router({
        get: os.get.handler(async ({ input, context, errors }) => {
            const { db } = context;
            const res = await db.get(input.id)

            if (!res)
                throw errors.NOT_FOUND();

            return res;
        }),

        list: os.list.handler(async ({ input, context }) => {
            const { cursor, order, limit } = input;
            const { db } = context;

            const res = await db.query({
                where: cursor
                    ? order === "asc" ? { id: { gt: "id" } } : { id: { lt: "id" } }
                    : undefined,
                limit,
                orderBy: { id: order },
            });

            return res;
        }),

        create: os.create.use(requireAuth).handler(async ({ input, context, errors }) => {
            const { db } = context;
            const res = await db.create(input, 'core')

            if (!res)
                throw errors.INTERNAL_SERVER_ERROR();

            return res;
        }),

        update: os.update.use(requireAuth).handler(async ({ input, context, errors }) => {
            const { db } = context;
            const res = await db.update(input.id, input, 'core')

            if (!res)
                throw errors.NOT_FOUND();

            return res;
        }),

        delete: os.delete.use(requireAuth).handler(async ({ input, context }) => {
            const { db } = context;
            await db.delete(input.id, 'core');
        }),
    });
