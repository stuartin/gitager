import { JobManager, type JobManagerOptions, type JobsTask } from "./job-manager";

export type { JobManagerOptions, JobManager, JobsTask }

export function createJobs(options: JobManagerOptions) {
    return new JobManager(options)
}