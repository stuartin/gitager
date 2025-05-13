import { ThreadWorker } from 'poolifier';

export default new ThreadWorker({
    ok: () => ({ status: 200, message: 'OK' }),
});
