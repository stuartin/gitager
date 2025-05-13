import { createPlugin } from "../../plugins";
import { jobsContract, jobsRouter } from "./jobs";


export const { contract: coreContract, router: coreRouter } = createPlugin(
    'core',
    {
        contract: (oc) => (
            oc.pub
                .prefix('/core')
                .router({
                    core: {
                        jobs: jobsContract,
                    },
                })
        ),
        router: (create, contract) => {
            const os = create(contract)
            return os.router({
                core: {
                    jobs: jobsRouter
                }
            })
        }
    }
)