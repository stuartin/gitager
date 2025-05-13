import type { GitagerOptions } from "../..";
import { JobManager, type JobsTask } from "./job-manager";

export type { JobManager, JobsTask }

export function createJobs(options: GitagerOptions) {
    return new JobManager(options)
}