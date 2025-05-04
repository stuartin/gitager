import { oo } from '@orpc/openapi';

const _SECURITY = [
  {
    bearerAuth: [],
  },
]

export const UNAUTHORIZED = oo.spec(
  {},
  current => ({
    ...current,
    // security: SECURITY, // TODO
    responses: {
      ...current.responses,
      401: {
        ...(current.responses && current.responses['401']),
        description: 'Unauthorized. Missing or invalid authentication.',
      },
    },
  }),
);

export const INTERNAL_SERVER_ERROR = oo.spec(
  {},
  current => ({
    ...current,
    responses: {
      ...current.responses,
      500: {
        ...(current.responses && current.responses['500']),
        description: 'Internal Server Error. This is a problem with the server that you cannot fix.',
      },
    },
  }),
);

export const UNPROCESSABLE_CONTENT = oo.spec(
  {},
  current => ({
    ...current,
    responses: {
      ...current.responses,
      422: {
        ...(current.responses && current.responses['422']),
        description: 'Unprocessable Content. Data sent to the server couldnt be processed.',
      },
    },
  }),
);

export const NOT_FOUND = oo.spec(
  {},
  current => ({
    ...current,
    responses: {
      ...current.responses,
      404: {
        ...(current.responses && current.responses['404']),
        description: 'Not Found. The requested resource was not found.',
      },
    },
  }),
);
