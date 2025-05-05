import { FixedThreadPool, PoolEvents } from "poolifier";
import path from "node:path"
import { fileURLToPath } from "node:url";
import type { GitagerOptions } from "../..";
import { GitDB } from "@gitager/git-db/db";
import { JobsSchema, type Jobs } from "../../api/core/jobs/jobs.contract";
import type { CursorPagination } from "../orpc/schemas";
import type { CronMessageEvent } from "./workers/cron";
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export class JobManager {
    db: GitDB<typeof JobsSchema>

    #pool = new FixedThreadPool<Jobs, Jobs>(1, path.join(__dirname, "workers/cron.ts"), {
        enableTasksQueue: true,
        tasksQueueOptions: {
            size: 5
        },
        onlineHandler: async () => {
            console.info('pool online')
            await this.db.init()

            const jobs = await this.db.query({
                where: {
                    OR: [
                        { status: { equals: "in-progress" } },
                        { status: { equals: "pending" } },
                    ]
                }
            })

            await Promise.all(
                jobs.map(async (job) => {
                    await this.#pool.execute(job, 'cron')
                })
            )
        },
        messageHandler: async (d) => {
            console.info('pool message', d)
            const message = d as CronMessageEvent
            const { job } = message

            switch (message.event) {
                case 'task-done':
                case 'task-scheduled': {
                    job.status = 'in-progress'
                    break;
                }
                case 'task-failed': {
                    job.status = 'failed'
                    break
                }
                case 'task-finished': {
                    job.status = 'finished'
                    break
                }
            }

            await this.db.update(job.id, job)
        },
        errorHandler: (e) => console.error('pool error', e)
    })

    constructor(
        options: GitagerOptions
    ) {
        this.db = new GitDB(options.git, JobsSchema, "/core", "/jobs")
        this.#pool.emitter?.on(PoolEvents.ready, () => console.info('Pool ready'))
        this.#pool.emitter?.on(PoolEvents.busy, () => console.info('Pool busy'))
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
        const result = await this.#pool.execute(res, 'cron')
        console.log({ result })
        await this.update(result.id, result)

        return res;
    }

    async update(id: string, input: Partial<Jobs>) {
        const res = await this.db.update(id, input, 'core')

        // TODO
        // get existing cron
        // remove/update it with the update

        return res;
    }

    async delete(id: string) {

        // TODO
        // get existing cron
        // remove/update it with the update
        await this.db.delete(id, 'core');
    }
}