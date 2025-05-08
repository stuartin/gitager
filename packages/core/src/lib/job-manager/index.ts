import type { GitagerOptions } from '../..';
import type { Jobs, JobsTask } from '../../api/core/jobs/jobs.contract';
import type { CursorPagination } from '../orpc/schemas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GitDB } from '@gitager/git-db/db';
import nodeCron from 'node-cron';
import { FixedThreadPool, PoolEvents } from 'poolifier';
import { JobsSchema } from '../../api/core/jobs/jobs.contract';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class JobManager {
  db: GitDB<typeof JobsSchema>;

  #cronLibrary = new Map<string, nodeCron.ScheduledTask>();

  #pool = new FixedThreadPool<
        Jobs<any> | undefined,
        Jobs<any> | undefined
  >(1, path.join(__dirname, 'worker.ts'), {
    enableTasksQueue: true,
    tasksQueueOptions: {
      size: 5,
    },
    onlineHandler: async () => {
      console.info('pool online');
      await this.db.init();

      const jobs = await this.db.query({
        where: {
          OR: [
            { status: { equals: 'in-progress' } },
            { status: { equals: 'pending' } },
          ],
        },
      });

      jobs.forEach(job => this.scheduleJob(job));
    },
    errorHandler: e => console.error('pool error', e),
  });

  constructor(
    options: GitagerOptions,
    tasks: JobsTask<any, any>[],
  ) {
    this.db = new GitDB(options.git, JobsSchema, '/core', '/jobs');
    tasks.forEach(task => this.#pool.addTaskFunction(task.name, task.execute));

    this.#pool.emitter?.on(PoolEvents.ready, () => console.info('Pool ready'));
    this.#pool.emitter?.on(PoolEvents.busy, () => console.info('Pool busy'));
  }

  private async runJob(job: Jobs) {
    const hasTask = this.#pool.hasTaskFunction(job.task);
    if (!hasTask)
      return;

    const outputs = await this.#pool.execute(job, job.task);
    const updatedJob = Object.assign({}, job, outputs);

    switch (updatedJob.status) {
      case 'finished':
      case 'failed':
        this.unscheduleJob(job);
        break;

      case 'in-progress':
        if (JSON.stringify(job) === JSON.stringify(updatedJob))
          return;
    }

    await this.update(updatedJob.id, updatedJob);
  }

  private scheduleJob(job: Jobs) {
    const existingCronJob = this.#cronLibrary.get(job.id);
    if (existingCronJob) {
      existingCronJob.stop();
      this.#cronLibrary.delete(job.id);
    }

    const cronJob = nodeCron.schedule(job.cron, async () => {
      await this.runJob(job);
    });

    this.#cronLibrary.set(job.id, cronJob);
  }

  private unscheduleJob(job: Jobs) {
    const cronJob = this.#cronLibrary.get(job.id);
    if (cronJob) {
      cronJob.stop();
      this.#cronLibrary.delete(job.id);
    }
  }

  async get(id: string) {
    const res = await this.db.get(id);
    return res;
  }

  async list(input: CursorPagination) {
    const { cursor, order, limit } = input;

    const res = await this.db.query({
      where: cursor
        ? order === 'asc' ? { id: { gt: 'id' } } : { id: { lt: 'id' } }
        : undefined,
      limit,
      orderBy: { id: order },
    });

    return res;
  }

  async create(input: Omit<Jobs, 'id'>) {
    const res = await this.db.create(input, 'core');

    this.scheduleJob(res);

    return res;
  }

  async update(id: string, input: Partial<Jobs>) {
    const res = await this.db.update(id, input, 'core');

    this.scheduleJob(res);

    return res;
  }

  async delete(id: string) {
    const res = await this.db.get(id);
    if (!res)
      return;

    this.unscheduleJob(res);

    await this.db.delete(id, 'core');
  }
}
