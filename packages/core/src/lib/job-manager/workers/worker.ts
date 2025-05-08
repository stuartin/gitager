import { ThreadWorker } from 'poolifier';

export default new ThreadWorker({
  echo: () => ({ status: 200, message: 'OK' }),
});
