import { gitager } from '@gitager/core';

import 'dotenv/config';

const server = gitager({
  git: {
    user: 'oauth2',
    token: process.env.GIT_TOKEN!,
    url: process.env.GIT_URL!,
  }
});

server.listen(
  3000,
  '127.0.0.1',
  () => console.log('Listening on http://127.0.0.1:3000'),
);
