import { GitDB } from "@gitager/git-db/db";
import { createContract, createRouter } from "../orpc";
import z from 'zod'
import type { AnyContractProcedure, AnyContractRouter } from "@orpc/contract";
import { createId } from "@paralleldrive/cuid2";

export const PluginIdSchema = z.string().cuid2().describe(`The id for the plugin`)

const TestSchema = z.object({
  id: PluginIdSchema,
  name: z.string().describe('The name of the test'),
  email: z.string().email().describe('Some email field'),
})

const GET = (oc: ReturnType<typeof createContract>, name: string) => oc.pub
  .$route({ method: 'GET', path: `/${name}/{id}`, description: `Get a single item for the ${name} plugin` })

const LIST = (oc: ReturnType<typeof createContract>, name: string) => oc.pub
  .$route({ method: 'GET', path: `/${name}/`, description: `Get a list of items for the ${name} plugin` })

const CREATE = (oc: ReturnType<typeof createContract>, name: string) => oc.auth
  .$route({ method: 'POST', path: `/${name}/`, description: `Create a new item for the ${name} plugin` })

const UPDATE = (oc: ReturnType<typeof createContract>, name: string) => oc.auth
  .$route({ method: 'PATCH', path: `/${name}/{id}`, description: `Update an existing item for the ${name} plugin` })

const DEL = (oc: ReturnType<typeof createContract>, name: string) => oc.auth
  .$route({ method: 'DELETE', path: `/${name}/{id}`, description: `Delete an existing item for the ${name} plugin` })


type Endpoints = {
  get: ReturnType<typeof GET>
  list: ReturnType<typeof LIST>
  create: ReturnType<typeof CREATE>
  update: ReturnType<typeof UPDATE>
  del: ReturnType<typeof DEL>
}

type EndpointsContract = { [Route in keyof Endpoints]: AnyContractProcedure }

export function definePlugin<
  Contract extends Partial<EndpointsContract>,
  Router extends { [Route in keyof Contract]: AnyContractRouter }
>(
  name: string,
  plugin: {
    contract: (endpoints: Endpoints) => Contract
    router: (contract: ReturnType<typeof createRouter<Contract>>) => Router
  }
) {
  z.string().regex(new RegExp("^[a-z-]+$"), "Name must be kebab-case").parse(name)

  const oc = createContract()
  const endpoints: Endpoints = {
    get: GET(oc, name),
    list: LIST(oc, name),
    create: CREATE(oc, name),
    update: UPDATE(oc, name),
    del: DEL(oc, name),
  }

  const contract = plugin.contract(endpoints)
  const _router = createRouter(contract)
  // const _router = createRouter(contract)
  //   .use(async ({ context, next }) => {
  //     const db = new GitDB(context.options.git, TestSchema, `/${name}`);
  //     await db.init();

  //     return next({
  //       context: { db },
  //     });
  //   });

  const router = plugin.router(_router)

  return { contract, router }
}

export const t = definePlugin(
  'test',
  {
    contract: ({ get, list }) => ({
      get: get
        .input(z.object({ id: z.string() }))
        .output(TestSchema),
      list: list.output(TestSchema.array())
    }),
    router: ({ get, list }) => ({
      get: get.handler(() => ({
        email: '',
        id: '',
        name: ''
      })),
      list: list.handler(() => ([{
        email: 'email@domain.com',
        id: createId(),
        name: ''
      }]))
    })
  }
)