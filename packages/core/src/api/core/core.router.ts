import { createRouter } from "../../lib/orpc";
import { coreContract } from "./core.contract";
import { servicesRouter } from "./services/services.router";

export const coreRouter = createRouter(coreContract)
    .router({
        core: {
            services: servicesRouter
        }
    })