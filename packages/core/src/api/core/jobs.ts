import { z } from 'zod';
import { NOT_FOUND, UNPROCESSABLE_CONTENT } from '../../lib/orpc/errors';
import { createPlugin } from '../../plugins';
import { requireAuth } from '../../plugins/middleware';
import { CursorPaginationSchema, IDSchema } from '../../plugins/schemas';

export const JobsSchema = z.object({
  id: IDSchema,
  name: z.string().describe('The name of the job'),
  task: z.string().describe('The task to execute'),
  cron: z.string().default('*/5 * * * *').describe('A cron string for when the job should run'),
  inputs: z.any().default({}).optional().describe('Any inputs that the task should receive'),
  outputs: z.any().default({}).optional().describe('Any outputs that the task will generate'),
  status: z.enum([
    'pending',
    'in-progress',
    'finished',
    'failed',
  ]).default('pending').describe('The current status of the job'),
});


export const { contract: jobsContract, router: jobsRouter } = createPlugin(
  'jobs',
  {
    contract: (oc) => (
      oc.pub
        .prefix('/jobs')
        .router({
          get: oc.pub
            .route({ method: 'GET', path: '/{id}', description: 'Get an job' })
            .errors({
              NOT_FOUND,
            })
            .input(JobsSchema.pick({ id: true }))
            .output(JobsSchema.optional()),

          list: oc.pub
            .route({ method: 'GET', path: '/', description: 'Get a list of jobs' })
            .input(CursorPaginationSchema)
            .output(z.array(JobsSchema)),

          create: oc.auth
            .route({ method: 'POST', path: '/', description: 'Create an job' })
            .errors({
              UNPROCESSABLE_CONTENT,
            })
            .input(JobsSchema.omit({ id: true }))
            .output(JobsSchema),

          update: oc.auth
            .route({ method: 'PATCH', path: '/{id}', description: 'Update an job' })
            .errors({
              UNPROCESSABLE_CONTENT,
              NOT_FOUND,
            })
            .input(
              JobsSchema
                .partial()
                .extend({ id: JobsSchema.shape.id }),
            )
            .output(JobsSchema),

          delete: oc.auth
            .route({ method: 'DELETE', path: '/{id}', description: 'Delete an job', successStatus: 204 })
            .input(JobsSchema.pick({ id: true })),
        })
    ),

    router: (create, contract) => {
      const os = create(contract)

      return os.router({
        get: os.get.handler(async ({ input, context, errors }) => {
          const { jobs } = context;
          const res = await jobs.get(input.id);

          if (!res)
            throw errors.NOT_FOUND();

          return res;
        }),

        list: os.list.handler(async ({ input, context }) => {
          const { jobs } = context;
          const res = await jobs.list(input);

          return res;
        }),

        create: os.create.use(requireAuth()).handler(async ({ input, context, errors }) => {
          const { jobs } = context;
          const res = await jobs.create(input);

          if (!res)
            throw errors.INTERNAL_SERVER_ERROR();

          return res;
        }),

        update: os.update.use(requireAuth()).handler(async ({ input, context, errors }) => {
          const { jobs } = context;
          const res = await jobs.update(input.id, input);

          if (!res)
            throw errors.NOT_FOUND();

          return res;
        }),

        delete: os.delete.use(requireAuth()).handler(async ({ input, context }) => {
          const { jobs } = context;
          await jobs.delete(input.id);
        }),
      });
    }
  }
)