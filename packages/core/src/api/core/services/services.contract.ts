import { z } from 'zod';
import { createContract } from '../../../lib/orpc';
import { NOT_FOUND, UNPROCESSABLE_CONTENT } from '../../../lib/orpc/errors';
import { CursorPaginationSchema } from '../../../lib/orpc/schemas';

export const ServicesSchema = z.object({
  id: z.string().cuid2().describe('The service id'),
  name: z.string().describe('The name of the service'),
});

const oc = createContract();
export const servicesContract = oc.pub
  .prefix('/services')
  .router({
    get: oc.pub
      .route({ method: 'GET', path: '/{id}', description: 'Get an service' })
      .errors({
        NOT_FOUND,
      })
      .input(ServicesSchema.pick({ id: true }))
      .output(ServicesSchema.optional()),

    list: oc.pub
      .route({ method: 'GET', path: '/', description: 'Get a list of services' })
      .input(CursorPaginationSchema)
      .output(z.array(ServicesSchema)),

    create: oc.auth
      .route({ method: 'POST', path: '/', description: 'Create an service' })
      .errors({
        UNPROCESSABLE_CONTENT,
      })
      .input(ServicesSchema.omit({ id: true }))
      .output(ServicesSchema),

    update: oc.auth
      .route({ method: 'PATCH', path: '/{id}', description: 'Update an service' })
      .errors({
        UNPROCESSABLE_CONTENT,
        NOT_FOUND,
      })
      .input(
        ServicesSchema
          .partial()
          .extend({ id: ServicesSchema.shape.id }),
      )
      .output(ServicesSchema),

    delete: oc.auth
      .route({ method: 'DELETE', path: '/{id}', description: 'Delete an service', successStatus: 204 })
      .input(ServicesSchema.pick({ id: true })),
  });
