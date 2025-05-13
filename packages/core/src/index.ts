import type { GitOptions } from '@gitager/git-db';
import { createAPI } from './api';
import { createServer } from './lib/orpc';
import { createJobs, type JobManager } from './lib/job-manager';
import type { GitagerPlugin, GitagerTask } from './plugins';

export interface GitagerOptions {
  git: GitOptions;
  api?: {
    basePath?: `/${string}`;
  };
  plugins?: GitagerPlugin[]
  tasks?: GitagerTask[]
}

export interface InitialContext {
  options: GitagerOptions;
  jobs: JobManager;
}

export type GitagerApp = ReturnType<typeof gitager>;

export function gitager(options: GitagerOptions) {
  const api = createAPI(options);
  const jobs = createJobs(options);

  return createServer(api, { options, jobs });
}
