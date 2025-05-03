import { serve } from '@hono/node-server';
import { gitager } from '@gitager/core';

serve({
  fetch: gitager({
    gitToken: '',
    gitUrl: ''
  }).fetch,
  port: 3000,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});
