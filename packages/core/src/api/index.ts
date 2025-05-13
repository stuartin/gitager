import type { AnyContractProcedure, AnyContractRouter } from '@orpc/contract';
import type { GitagerOptions } from '..';
import { createPlugin } from '../plugins';
import { coreContract, coreRouter } from './core';

export function createAPI(options: GitagerOptions) {

  const plugins = options.plugins ?? [];
  const contracts = plugins.reduce(
    (acc, { contract }) => ({ ...acc, ...contract }),
    {} as Record<string, AnyContractProcedure>
  );
  const routers = plugins.reduce(
    (acc, { router }) => ({ ...acc, ...router }),
    {} as Record<string, AnyContractRouter>
  );

  const { router } = createPlugin(
    'api',
    {
      contract: (oc) => (
        oc.pub
          .prefix(options.api?.basePath || '/api/v1')
          .router({
            ...contracts,
            ...coreContract
          })
      ),
      router: (create, contract) => {
        const os = create(contract)
        return os.router({
          ...routers,
          ...coreRouter
        })
      }
    }
  )


  return router;
}
