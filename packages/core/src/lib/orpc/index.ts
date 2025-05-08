import type { AnyContractRouter } from '@orpc/contract';
import type { AnyRouter } from '@orpc/server';
import type { GitagerOptions } from '../..';
import type { JobManager } from '../job-manager';
import { createServer as createNodeServer } from 'node:http';
import { oc } from '@orpc/contract';
import { OpenAPIHandler } from '@orpc/openapi/node';
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins';
import { implement, onError, os } from '@orpc/server';
import { CORSPlugin } from '@orpc/server/plugins';
import { ZodSmartCoercionPlugin, ZodToJsonSchemaConverter } from '@orpc/zod';
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED } from './errors';

interface InitialContext {
  options: GitagerOptions;
  jobManager: JobManager;
}

export function createServer<T extends AnyRouter>(router: T, context: InitialContext) {
  const handler = new OpenAPIHandler<InitialContext>(router, {
    interceptors: [
      onError((error) => {
        console.error(error);
      }),
    ],
    plugins: [
      new CORSPlugin(),
      new ZodSmartCoercionPlugin(),
      new OpenAPIReferencePlugin({
        schemaConverters: [
          new ZodToJsonSchemaConverter(),
        ],
        specGenerateOptions: {
          info: {
            title: 'Gitager',
            version: '1.0.0',
          },
        },
      }),
    ],
  });

  return createNodeServer(async (req, res) => {
    const result = await handler.handle(req, res, {
      context,
    });

    if (!result.matched) {
      res.statusCode = 404;
      res.end('NOT_FOUND');
    }
  });
}

export function createContract() {
  return {
    pub: oc.errors({
      INTERNAL_SERVER_ERROR,
    }),
    auth: oc.errors({
      INTERNAL_SERVER_ERROR,
      UNAUTHORIZED,
    }),
  };
}

export function createRouter<T extends AnyContractRouter>(contract: T) {
  return implement<typeof contract>(contract)
    .$context<InitialContext>();
}

export function createMiddleware() {
  return os.$context<InitialContext>();
}
