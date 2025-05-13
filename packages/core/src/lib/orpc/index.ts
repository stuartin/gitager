import type { AnyRouter } from '@orpc/server';
import type { InitialContext } from '../..';
import { createServer as createNodeServer } from 'node:http';
import { OpenAPIHandler } from '@orpc/openapi/node';
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins';
import { onError } from '@orpc/server';
import { CORSPlugin } from '@orpc/server/plugins';
import { ZodSmartCoercionPlugin, ZodToJsonSchemaConverter } from '@orpc/zod';



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
