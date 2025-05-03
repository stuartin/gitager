import { antfu } from '@antfu/eslint-config';
import { rules } from './custom';

export function base() {
  return antfu(
    {
      stylistic: {
        indent: 2,
        semi: true,
      },
      formatters: true,
    },
    rules,
  );
}

export async function svelte() {
  return antfu(
    {
      stylistic: {
        indent: 2,
        semi: true,
      },
      formatters: true,
      svelte: true,
    },
    rules,
  );
}
