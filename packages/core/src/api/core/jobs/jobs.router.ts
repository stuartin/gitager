import { createRouter } from '../../../lib/orpc';
import { requireAuth } from '../../../lib/orpc/middleware/require-auth';
import { jobsContract, JobsSchema } from './jobs.contract';

const os = createRouter(jobsContract)
export const jobsRouter = os
    .router({
        get: os.get.handler(async ({ input, context, errors }) => {
            const { jobManager } = context;
            const res = await jobManager.get(input.id)

            if (!res)
                throw errors.NOT_FOUND();

            return res;
        }),

        list: os.list.handler(async ({ input, context }) => {
            const { jobManager } = context;
            const res = await jobManager.list(input);

            return res;
        }),

        create: os.create.use(requireAuth).handler(async ({ input, context, errors }) => {
            const { jobManager } = context;
            const res = await jobManager.create(input)

            if (!res)
                throw errors.INTERNAL_SERVER_ERROR();

            return res;
        }),

        update: os.update.use(requireAuth).handler(async ({ input, context, errors }) => {
            const { jobManager } = context;
            const res = await jobManager.update(input.id, input)

            if (!res)
                throw errors.NOT_FOUND();

            return res;
        }),

        delete: os.delete.use(requireAuth).handler(async ({ input, context }) => {
            const { jobManager } = context;
            await jobManager.delete(input.id);
        }),
    });
