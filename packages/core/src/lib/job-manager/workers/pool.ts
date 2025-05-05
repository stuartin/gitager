import { ThreadWorker } from 'poolifier'

function yourFunction() {
    // this will be executed in the worker thread,
    // the data will be received by using the execute method
    return { ok: true }
}

export default new ThreadWorker(
    {
        plop: (workerData?) => {
            return workerData
        },
        yourFunction,
        echo: (workerData?) => {
            console.log('inside worker', workerData)
            return { location: 'worker' }
        }
    },
    {
        maxInactiveTime: 60000,
    }
)