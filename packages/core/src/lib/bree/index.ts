import Bree from "bree";
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type JobDefinition = {
    name: string
    code: string            // Worker thread code as string
    interval?: string       // Optional cron or time string (e.g., '10s', '1m')
    timeout?: string        // Optional delay before first run
    workerData?: any        // Optional data passed into the worker
}

export function createBree(_jobs: JobDefinition[]) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url))

    const bree = new Bree({
        root: path.join(__dirname, 'jobs'),
        defaultExtension: "ts",
        jobs: [
            {
                name: "plopjs",
                // path: path.join(__dirname, 'jobs', 'plopjs.ts'),
                cron: "*/1 * * * *",
            },
        ],
    })

    bree.on('done', (msg) => {
        console.log('done:', msg)
    })

    bree.on('worker created', (name) => {
        console.log('worker created', name);

        const worker = bree.workers.get(name)

        if (worker) {
            worker.on('message', (msg) => {
                console.log('🔔 Message from worker:', msg)
            })

            worker.on('exit', (code) => {
                console.log(`👋 Worker exited with code ${code}`)
            })

            worker.on('error', (err) => {
                console.error('❌ Worker error:', err)
            })
        }
    });

    bree.on('worker deleted', (name) => {
        console.log('worker deleted', name);
    });

    bree.on('message', (msg) => {
        console.log('Message from worker:', msg)
    })

    return bree
}