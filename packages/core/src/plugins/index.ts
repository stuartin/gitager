import { ContractProcedure, oc, type AnyContractProcedure, type AnyContractRouter, type ContractRouter } from "@orpc/contract";
import { implement, os, type AnyMiddleware, type AnyProcedure, type Router } from "@orpc/server";
import type { InitialContext } from "..";
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "../lib/orpc/errors";
import type { JobsTask } from "../lib/job-manager";

export type GitagerContract = ReturnType<typeof createContract>
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

export type GitagerRouter = ReturnType<typeof createRouter>
export function createRouter<T extends AnyContractRouter>(contract: T) {
    return implement<typeof contract>(contract)
        .$context<InitialContext>();
}

export type GitagerMiddleware = ReturnType<typeof createMiddleware>
export function createMiddleware() {
    return os.$context<InitialContext>();
}


export type GitagerPluginContract = {
    [key: string]: AnyContractProcedure | GitagerPluginContract;
};

export type GitagerPluginRouter = {
    [key: string]: AnyProcedure | GitagerPluginRouter;
};

export type GitagerPlugin = ReturnType<typeof createPlugin<any, GitagerPluginContract, GitagerPluginRouter>>
export function createPlugin<
    Middleware,
    Contract,
    Router
>(
    name: string,
    plugin: {
        middleware?: (mw: ReturnType<typeof createMiddleware>) => Middleware
        contract: (oc: ReturnType<typeof createContract>) => Contract
        router: (
            create: typeof createRouter,
            contract: Contract,
            middleware: Middleware extends Middleware ? Middleware : undefined
        ) => Router
    }
): { contract: Contract; router: Router } {
    const mw = createMiddleware()
    const oc = createContract()
    const middleware = plugin.middleware?.(mw) as Middleware extends Middleware ? Middleware : undefined
    const contract = plugin.contract(oc)
    const router = plugin.router(createRouter, contract, middleware)

    return {
        contract,
        router,
    }
}

export type GitagerTask = ReturnType<typeof createTask>
export function createTask<Input, Output>(
    name: string,
    execute: JobsTask<Input, Output>['execute']
): JobsTask<Input, Output> {
    return {
        name,
        execute
    }
}