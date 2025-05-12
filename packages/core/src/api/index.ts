import type { GitagerOptions } from '..';
import { createContract, createRouter } from '../lib/orpc';
import { t } from '../lib/plugins';
import { coreContract } from './core/core.contract';
import { coreRouter } from './core/core.router';

export function createAPI(options: GitagerOptions) {
  const apiContract = createContract().pub.prefix(options.api?.basePath || '/api/v1').router({
    ...coreContract,
    test: t.contract
  });

  const apiRouter = createRouter(apiContract)
    .router({
      ...coreRouter,
      test: t.router
    });

  return apiRouter;
}
