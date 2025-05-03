import type { TypedFlatConfigItem } from '@antfu/eslint-config';

export const rules: TypedFlatConfigItem = {
  rules: {
    'style/max-len': ['error', { code: 120 }],
    'node/prefer-global/process': ['off'],
    'no-console': ['off'],
    'unicorn/filename-case': [
      'error',
      {
        case: 'kebabCase',
        ignore: [/(^[A-Z].md|^migrations\/.json)*/i],
      },
    ],
  },
};
