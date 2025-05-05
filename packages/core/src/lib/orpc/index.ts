import { oc, type AnyContractRouter } from "@orpc/contract";
import { OpenAPIHandler } from "@orpc/openapi/node";
import { implement, onError, os, type AnyProcedure, type AnyRouter, type Context, type InferRouterInitialContexts } from "@orpc/server";
import { CORSPlugin } from "@orpc/server/plugins";
import { ZodSmartCoercionPlugin, ZodToJsonSchemaConverter } from "@orpc/zod";
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "./errors";
import type { GitagerOptions } from "../..";
import { createServer as createNodeServer } from 'node:http'
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import type { JobManager } from "../job-manager";

type InitialContext = {
    options: GitagerOptions,
    jobManager: JobManager
}

export function createServer<T extends AnyRouter>(context: InitialContext, router: T) {
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
    })

    return createNodeServer(async (req, res) => {
        const result = await handler.handle(req, res, {
            context
        })

        if (!result.matched) {
            res.statusCode = 404
            res.end('NOT_FOUND')
        }
    })
}

export function createContract() {
    return {
        pub: oc.errors({
            INTERNAL_SERVER_ERROR,
        }),
        auth: oc.errors({
            INTERNAL_SERVER_ERROR,
            UNAUTHORIZED
        })
    }
}

export function createRouter<T extends AnyContractRouter>(contract: T) {
    return implement<typeof contract>(contract)
        .$context<InitialContext>()
}

export function createMiddleware() {
    return os.$context<InitialContext>()
}