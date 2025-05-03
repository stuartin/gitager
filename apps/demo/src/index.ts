import { serve } from '@hono/node-server';
import { gitager } from '@gitager/core';
import 'dotenv/config'

serve({
  fetch: gitager({
    git: {
      user: 'oauth2',
      token: process.env.GIT_TOKEN!,
      url: process.env.GIT_URL!
    }
  }).fetch,
  port: 3000,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});
