import type { GitagerOptions } from '..';
import { createPlugin } from '../plugins';
import { coreContract, coreRouter } from './core';

export function createAPI(options: GitagerOptions) {
  const { router } = createPlugin(
    'api',
    {
      contract: (oc) => (
        oc.pub
          .prefix(options.api?.basePath || '/api/v1')
          .router({
            ...coreContract
          })
      ),
      router: (create, contract) => {
        const os = create(contract)
        return os.router({
          ...coreRouter
        })
      }
    }
  )


  return router;
}
