import type { GitOptions } from '@gitager/git-db';
import { createAPI } from './api';
import { apiTask } from './lib/job-manager/tasks/api';
import { createServer } from './lib/orpc';
import { createJobs, type JobManager } from './lib/job-manager';

export interface GitagerOptions {
  git: GitOptions;
  api?: {
    basePath?: `/${string}`;
  };
}

export interface InitialContext {
  options: GitagerOptions;
  jobs: JobManager;
}

export type GitagerApp = ReturnType<typeof gitager>;

export function gitager(options: GitagerOptions) {
  const api = createAPI(options);
  const jobs = createJobs({ git: options.git, tasks: [apiTask] });

  return createServer(api, { options, jobs });
}
