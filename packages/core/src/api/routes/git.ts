import type { GitagerFactory } from "../..";

export function gitRoute(factory: GitagerFactory) {
    return factory.createApp()
        .get('/endpoint', (c) => {
            return c.text('GET /endpoint')
        })
        .post((c) => {
            return c.text('POST /endpoint')
        })
        .delete((c) => {
            return c.text('DELETE /endpoint')
        })
}