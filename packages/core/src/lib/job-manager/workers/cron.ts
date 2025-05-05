import { ThreadWorker } from 'poolifier'
import nodeCron from "node-cron"
import type { Jobs } from '../../../api/core/jobs/jobs.contract'
import { parentPort } from 'worker_threads';

// these will change when v4 node-cron comes out
// there is also a task registry!!
export type TaskEvent = typeof taskEvents[number]
export const taskEvents = [
    'task-scheduled',
    'task-done',
    'task-finished',
    'task-failed',
] as const

export type CronMessageEvent = {
    event: TaskEvent
    job: Jobs,
    result: unknown
}

export default new ThreadWorker<Jobs & { fn: () => Jobs }, undefined>(
    {
        cron: async (workerData?) => {
            let job = workerData!
            if (job.status !== 'pending') return

            const scheduled = nodeCron.schedule(job.cron, () => {
                job.fn()
            })

            for (const ev of taskEvents) {
                scheduled.on(ev, (result: unknown) => {
                    const messageEvent: CronMessageEvent = { event: ev, job, result }
                    parentPort?.postMessage(messageEvent)
                })
            }

            // task-scheduled doesnt actually exist in node-cron
            // post it anyway for consistent handling
            const messageEvent: CronMessageEvent = { event: 'task-scheduled', job, result: undefined }
            parentPort?.postMessage(messageEvent)
        }
    },
    {
        maxInactiveTime: 60000,
    }
)