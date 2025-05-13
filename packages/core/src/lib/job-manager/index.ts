import { JobManager, type JobManagerOptions } from "./job-manager";

export type { JobManagerOptions, JobManager }

export function createJobs(options: JobManagerOptions) {
    return new JobManager(options)
}