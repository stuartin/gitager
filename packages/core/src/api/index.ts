import type { GitagerOptions } from '..';
import { createPlugin, type GitagerPluginContract, type GitagerPluginRouter } from '../plugins';
import { coreContract, coreRouter } from './core';

export function createAPI(options: GitagerOptions) {

  const plugins = options.plugins ?? [];

  const contracts = plugins.reduce(
    (acc, { contract }) => deepMerge(acc, contract),
    {} as GitagerPluginContract
  );

  const routers = plugins.reduce(
    (acc, { router }) => deepMerge(acc, router),
    {} as GitagerPluginRouter
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


function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<A extends object, B extends object>(a: A, b: B): A & B {
  const result: any = { ...a };

  for (const key in b) {
    if (isObject(b[key]) && isObject(result[key])) {
      result[key] = deepMerge(result[key] as object, b[key] as object);
    } else {
      result[key] = b[key];
    }
  }

  return result;
}