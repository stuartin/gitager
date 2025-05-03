import { z } from "zod";
import type { ApiEnv, GitagerFactory } from ".."
import { FileDB } from "../../lib/file"
import { createMiddleware } from "hono/factory";
import { zValidator } from "@hono/zod-validator"
import { createId } from "@paralleldrive/cuid2";

const OrgsSchema = z.object({
    id: z.string().cuid2(),
    name: z.string()
});

export function orgs(factory: GitagerFactory) {

    const middleware = createMiddleware<ApiEnv & {
        Variables: {
            db: FileDB<typeof OrgsSchema>
        }
    }>(async (c, next) => {
        const options = c.get('options')
        const db = new FileDB("/repos/gitager", "/orgs", OrgsSchema, options)
        await db.init()
        c.set('db', db)

        await next()
    })

    return factory.createApp()
        .use(middleware)
        .basePath('/orgs')
        .get('/', async (c) => {
            const db = c.get('db')
            const orgs = await db.findMany()

            return c.json(orgs)
        })
        .get('/:id', async (c) => {
            const id = c.req.param('id')
            const db = c.get('db')
            const org = await db.findOne(id)

            return c.json(org)
        })
        .patch('/:id', zValidator('json', OrgsSchema), async (c) => {
            const id = c.req.param('id')
            const valid = c.req.valid('json')
            const db = c.get('db')
            await db.write(id, valid)

            return c.json(valid)
        })
        .post('/', zValidator('json', OrgsSchema.omit({ id: true })), async (c) => {
            const valid = c.req.valid('json')
            const db = c.get('db')
            const id = createId();
            const withId = { id, ...valid }
            await db.write(id, withId)

            return c.json(valid)
        })
        .delete('/:id', async (c) => {
            const id = c.req.param('id')
            const db = c.get('db')
            await db.delete(id)

            return c.newResponse(null, 204)
        })
}