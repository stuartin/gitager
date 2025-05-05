import { z } from 'zod';
import { createContract } from '../../../lib/orpc';
import { NOT_FOUND, UNPROCESSABLE_CONTENT } from '../../../lib/orpc/errors';
import { CursorPaginationSchema } from '../../../lib/orpc/schemas';

export type Jobs = z.infer<typeof JobsSchema>
export const JobsSchema = z.object({
    id: z.string().cuid2().describe('The job id'),
    name: z.string().describe('The name of the job'),
    type: z.enum(['plop']).describe("The type of job"),
    cron: z.string().default("*/5 * * * *").describe("A cron string for when the job should run"),
    inputs: z.record(z.string()).optional().describe("Any inputs that the job should receive"),
    outputs: z.record(z.string()).optional().describe("Any outputs that the job will end with"),
    status: z.enum(["pending", "in-progress", "completed", "error"]).default("pending").describe("The current status of the job")
});

const oc = createContract()
export const jobsContract = oc.pub
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
                    .extend({ id: JobsSchema.shape.id })
            )
            .output(JobsSchema),

        delete: oc.auth
            .route({ method: 'DELETE', path: '/{id}', description: 'Delete an job', successStatus: 204 })
            .input(JobsSchema.pick({ id: true })),
    });
