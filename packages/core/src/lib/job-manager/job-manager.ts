import type { CursorPagination } from '../orpc/schemas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGitDB, type GitDB, type GitOptions } from '@gitager/git-db';
import nodeCron from 'node-cron';
import { FixedThreadPool, PoolEvents, type TaskFunction } from 'poolifier';
import { JobsSchema } from '../../api/core/jobs';
import type { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type JobsTask<TInput = any, TOutput = any> = {
  name: string;
  execute: TaskFunction<Jobs<TInput, TOutput> | undefined, Jobs<TInput, TOutput> | undefined>;
}

type Jobs<
  TInputs = any,
  TOutputs = any,
> = Omit<z.infer<typeof JobsSchema>, 'inputs' | 'outputs'> & {
  inputs?: TInputs;
  outputs?: TOutputs;
};

export type JobManagerOptions = {
  git: GitOptions,
  tasks: JobsTask<any, any>[],
}

export class JobManager {
  protected db: GitDB<typeof JobsSchema>;

  #cronLibrary = new Map<string, nodeCron.ScheduledTask>();

  #pool = new FixedThreadPool<
    Jobs<any> | undefined,
    Jobs<any> | undefined
  >(
    1,
    path.join(__dirname, 'workers', 'worker.ts'),
    {
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
    }
  );

  constructor(
    options: JobManagerOptions,
  ) {
    this.db = createGitDB({
      git: options.git,
      schema: JobsSchema,
      basePath: '/core',
      subPath: '/jobs'
    });
    options.tasks.forEach(task => this.addTask(task));

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

  async addTask(task: JobsTask) {
    if (this.#pool.hasTaskFunction(task.name)) return

    await this.#pool.addTaskFunction(task.name, task.execute)
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
