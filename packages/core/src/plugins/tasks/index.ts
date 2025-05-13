import { createTask } from "..";

interface Input {
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: Record<string, string>;
}

interface Output {
  error?: string;
  mark: boolean;
}


const apiTask = createTask<Input, Output>(
  'api-task',
  (job) => {
    if (!job) return;

    try {
      console.log({ job });

      // init
      if (job?.status === 'pending') {
        // API call to raise PR and save the PR id to the outputs
        job.status = 'in-progress';
      }

      // finished
      if (job?.outputs?.mark) {
        job.status = 'finished';
      }

      // in-progress
      job.outputs = {
        mark: true,
      };
    }
    catch (error) {
      if (error instanceof Error) {
        job.outputs!.error = error.message;
      }

      job.status = 'failed';
    }

    return job;
  },
)