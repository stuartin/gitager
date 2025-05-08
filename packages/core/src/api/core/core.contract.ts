import { createContract } from '../../lib/orpc';
import { jobsContract } from './jobs/jobs.contract';
import { servicesContract } from './services/services.contract';

export const coreContract = createContract()
  .pub
  .prefix('/core')
  .router({
    core: {
      services: servicesContract,
      jobs: jobsContract,
    },
  });
