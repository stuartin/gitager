import { serve } from '@hono/node-server';
import { gitager } from '@gitager/core';
import 'dotenv/config'

serve({
  fetch: gitager({
    gitUser: 'oauth2',
    gitToken: process.env.GIT_TOKEN!,
    gitUrl: process.env.GIT_URL!
  }).fetch,
  port: 3000,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});
