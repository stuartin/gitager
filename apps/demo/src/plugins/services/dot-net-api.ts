import { NOT_FOUND, UNPROCESSABLE_CONTENT } from '@gitager/core/errors';
import { createPlugin } from '@gitager/core/plugins';
import { gitDB, requireAuth } from '@gitager/core/plugins/middleware';
import { CursorPaginationSchema, IDSchema } from '@gitager/core/plugins/schemas';
import { z } from 'zod';


export const DotNetApiSchema = z.object({
    id: IDSchema,
    name: z.string().describe('The name of the dot net api'),
});


const PLUGIN_NAME = 'dot-net-api'
export const { contract: dotNetAPIContract, router: dotNetAPIRouter } = createPlugin(
    PLUGIN_NAME,
    {
        contract: (oc) => (
            oc.pub
                .prefix(`/${PLUGIN_NAME}`)
                .router({
                    get: oc.pub
                        .route({ method: 'GET', path: '/{id}', description: 'Get a dot net api' })
                        .errors({
                            NOT_FOUND,
                        })
                        .input(DotNetApiSchema.pick({ id: true }))
                        .output(DotNetApiSchema.optional()),

                    list: oc.pub
                        .route({ method: 'GET', path: '/', description: 'Get a list of dot net apis' })
                        .input(CursorPaginationSchema)
                        .output(z.array(DotNetApiSchema)),

                    create: oc.auth
                        .route({ method: 'POST', path: '/', description: 'Create a dot net api' })
                        .errors({
                            UNPROCESSABLE_CONTENT,
                        })
                        .input(DotNetApiSchema.omit({ id: true }))
                        .output(DotNetApiSchema),

                    delete: oc.auth
                        .route({ method: 'DELETE', path: '/{id}', description: 'Delete a dot net api', successStatus: 204 })
                        .input(DotNetApiSchema.pick({ id: true })),
                })
        ),

        router: (create, contract) => {
            const os = create(contract).use(
                gitDB({
                    schema: DotNetApiSchema,
                    basePath: `/services`,
                    subPath: `/${PLUGIN_NAME}`
                })
            )

            return os.router({
                get: os.get.handler(async ({ input, context, errors }) => {
                    const { db } = context;
                    const res = await db.get(input.id);

                    if (!res)
                        throw errors.NOT_FOUND();

                    return res;
                }),

                list: os.list.handler(async ({ input, context }) => {
                    const { db } = context;
                    const { cursor, order, limit } = input;

                    const res = await db.query({
                        where: cursor
                            ? order === 'asc' ? { id: { gt: 'id' } } : { id: { lt: 'id' } }
                            : undefined,
                        limit,
                        orderBy: { id: order },
                    });
                    return res;
                }),

                create: os.create.use(requireAuth()).handler(async ({ input, context, errors }) => {
                    const { db } = context;
                    const res = await db.create(input);

                    if (!res)
                        throw errors.INTERNAL_SERVER_ERROR();

                    return res;
                }),

                delete: os.delete.use(requireAuth()).handler(async ({ input, context }) => {
                    const { db } = context;
                    await db.delete(input.id);
                }),
            });
        }
    }
)