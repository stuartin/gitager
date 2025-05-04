import { gitager } from '@gitager/core';

import 'dotenv/config'

const server = gitager({
  git: {
    user: 'oauth2',
    token: process.env.GIT_TOKEN!,
    url: process.env.GIT_URL!
  },
  blueprints: [
    {
      name: 'linux-node-api',
      components: [
        {
          name: 'infra-pagerduty',
          type: 'plopjs',
          inputs: {
            git: process.env.GIT_URL!,
            plopFile: "/.gitager/plop.ts",
            plopInputs: {
              hello: 'world'
            }
          }
        },
        {
          name: 'infra-network',
          type: 'plopjs',
          inputs: {
            git: process.env.GIT_URL!,
            plopFile: "/.gitager/plop.ts",
            plopInputs: {
              hello: 'world'
            }
          }
        },
        {
          name: 'infra-app',
          type: 'plopjs',
          dependsOn: 'infra-network',
          inputs: {
            git: process.env.GIT_URL!,
            plopFile: "/.gitager/plop.ts",
            plopInputs: {
              hello: 'world'
            }
          }
        },
        {
          name: 'app-repo',
          type: 'plopjs',
          dependsOn: 'infra-app',
          inputs: {
            git: process.env.GIT_URL!,
            plopFile: "/.gitager/plop.ts",
            plopInputs: {
              hello: 'world'
            }
          }
        }
      ]
    }
  ]
})

server.listen(
  3000,
  '127.0.0.1',
  () => console.log('Listening on http://127.0.0.1:3000')
)