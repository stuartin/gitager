import { oc, type AnyContractRouter } from "@orpc/contract";
import { implement, os } from "@orpc/server";
import type { InitialContext } from "..";
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "../lib/orpc/errors";

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