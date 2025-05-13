import { createPlugin } from "@gitager/core/plugins"
import { dotNetAPIContract, dotNetAPIRouter } from "./dot-net-api"

export const servicesPlugin = createPlugin(
    'services',
    {
        contract: (oc) => (
            oc.pub
                .prefix('/services')
                .router({
                    services: {
                        dotNetAPI: dotNetAPIContract,
                    },
                })
        ),
        router: (create, contract) => {
            const os = create(contract)
            return os.router({
                services: {
                    dotNetAPI: dotNetAPIRouter
                }
            })
        }
    }
)