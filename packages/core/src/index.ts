import type { GitOptions } from '@gitager/git-db/types';
import type { BluePrint } from './api/core/blueprints/blueprints.contract';
import { createAPI } from './api';
import { JobManager } from './lib/job-manager';
import { apiTask } from './lib/job-manager/tasks/api';
import { createServer } from './lib/orpc';

export interface GitagerOptions {
  git: GitOptions;
  api?: {
    basePath?: `/${string}`;
  };
  blueprints?: BluePrint[];
}

export type GitagerApp = ReturnType<typeof gitager>;

export function gitager(options: GitagerOptions) {
  const api = createAPI(options);
  const jobManager = new JobManager(options, [apiTask]);

  return createServer(api, { options, jobManager });
}
