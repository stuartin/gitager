import { parentPort } from 'worker_threads'

export default async function run() {

    parentPort?.postMessage({ type: 'done', time: new Date().toISOString() })
}

run()