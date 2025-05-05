import { FixedThreadPool, PoolEvents } from "poolifier";
import path from "node:path"
import { fileURLToPath } from "node:url";
import type { GitagerOptions } from "../..";
import { GitDB } from "@gitager/git-db/db";
import { JobsSchema, type Jobs } from "../../api/core/jobs/jobs.contract";
import type { CursorPagination } from "../orpc/schemas";
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export class JobManager {
    db: GitDB<typeof JobsSchema>

    #pool = new FixedThreadPool(1, path.join(__dirname, "workers/pool.ts"), {
        enableTasksQueue: true,
        tasksQueueOptions: {
            size: 5
        },
        onlineHandler: async () => {
            console.info('pool online')
            await this.db.init()
        },
        errorHandler: (e) => console.error('pool error', e)
    })

    constructor(
        options: GitagerOptions
    ) {
        this.db = new GitDB(options.git, JobsSchema, "/core", "/jobs")
        this.#pool.emitter?.on(PoolEvents.ready, () => console.info('Pool ready'))
        this.#pool.emitter?.on(PoolEvents.busy, () => console.info('Pool busy'))

        // this.#pool.execute({ location: 'manager' }, 'echo').then((res) => {
        //     console.log('inside manager', res)
        // })
    }

    private async runJob(job: Jobs) {
        switch (job.type) {
            case 'plop': {
                this.#pool
            }
                break;
        }

    }

    async get(id: string) {
        const res = await this.db.get(id)
        return res;
    }

    async list(input: CursorPagination) {
        const { cursor, order, limit } = input;

        const res = await this.db.query({
            where: cursor
                ? order === "asc" ? { id: { gt: "id" } } : { id: { lt: "id" } }
                : undefined,
            limit,
            orderBy: { id: order },
        });

        return res;
    }

    async create(input: Omit<Jobs, 'id'>) {
        const res = await this.db.create(input, 'core')
        // run job
        return res;
    }

    async update(id: string, input: Partial<Jobs>) {
        const res = await this.db.update(id, input, 'core')
        return res;
    }

    async delete(id: string) {
        await this.db.delete(id, 'core');
    }
}