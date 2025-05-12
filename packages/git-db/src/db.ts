import type { z } from 'zod';
import path from 'node:path';
import { createId } from '@paralleldrive/cuid2';
import { fs } from 'memfs';
import { Git, type GitOptions } from './git';

export type GitDBOptions = {
  /**
   * The git configuration options
   */
  git: GitOptions;

  /**
 * The zod schema to use when validating/querying the data
 */
  schema: z.AnyZodObject,

  /**
 * The virtual folder to clone the repository to. Must be unique per repository
 */
  basePath: `/${string}`,

  /**
 * A sub path to use as the root folder
 * @default "/"
 */
  subPath: `/${string}`
}


type Primitive = string | number | boolean;

interface FilterOps<T extends Primitive> {
  equals?: T;
  not?: T;
  in?: T[];
  contains?: T extends string ? string : never;
  startsWith?: T extends string ? string : never;
  endsWith?: T extends string ? string : never;
  lt?: T;
  lte?: T;
  gt?: T;
  gte?: T;
  regex?: string;
  fuzzy?: string;
}

type Where<T> = {
  [K in keyof T]?: T[K] extends Primitive ? FilterOps<T[K]> : never
} & {
  AND?: Where<T>[];
  OR?: Where<T>[];
  NOT?: Where<T>[];
};

interface QueryOptions<T> {
  where?: Where<T>;
  orderBy?: keyof T | { [K in keyof T]?: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
}

function matches<T>(value: T, filter: FilterOps<any>): boolean {
  if (filter.equals !== undefined && value !== filter.equals)
    return false;
  if (filter.not !== undefined && value === filter.not)
    return false;
  if (filter.in && !filter.in.includes(value))
    return false;
  if (filter.contains && typeof value === 'string' && !value.includes(filter.contains))
    return false;
  if (filter.startsWith && typeof value === 'string' && !value.startsWith(filter.startsWith))
    return false;
  if (filter.endsWith && typeof value === 'string' && !value.endsWith(filter.endsWith))
    return false;
  if (filter.lt !== undefined && value >= filter.lt)
    return false;
  if (filter.lte !== undefined && value > filter.lte)
    return false;
  if (filter.gt !== undefined && value <= filter.gt)
    return false;
  if (filter.gte !== undefined && value < filter.gte)
    return false;
  if (filter.regex && typeof value === 'string') {
    const re = new RegExp(filter.regex);
    if (!re.test(value))
      return false;
  }
  if (filter.fuzzy && typeof value === 'string') {
    const score = fuzzyMatchScore(filter.fuzzy, value);
    if (score < 0.4)
      return false;
  }
  return true;
}

function fuzzyMatchScore(needle: string, haystack: string): number {
  needle = needle.toLowerCase();
  haystack = haystack.toLowerCase();
  let score = 0;
  let i = 0;
  for (const char of haystack) {
    if (char === needle[i]) {
      score++;
      i++;
    }
  }
  return score / needle.length;
}

function matchesWhere<T>(item: T, where: Where<T>): boolean {
  const { AND, OR, NOT, ...fields } = where;

  for (const key in fields) {
    const filter = fields[key as keyof T] as FilterOps<any>;
    const val = item[key as keyof T];
    if (!matches(val, filter))
      return false;
  }
  if (AND && !AND.every(cond => matchesWhere(item, cond)))
    return false;
  if (OR && !OR.some(cond => matchesWhere(item, cond)))
    return false;
  if (NOT && NOT.some(cond => matchesWhere(item, cond)))
    return false;

  return true;
}

export class GitDB<TSchema extends z.ZodTypeAny> extends Git {

  #options: GitDBOptions
  #path: string;

  constructor(
    options: GitDBOptions
  ) {
    super(options.git);
    this.#options = options
    this.#path = path.join(options.basePath, options.subPath);
  }

  async init() {
    await this.clone(this.#options.basePath);
  }

  private getFilePath(id: string) {
    return path.join(this.#path, `${id}.json`);
  }

  async get(id: string, branch?: string): Promise<z.infer<TSchema> | null> {
    await this.pull(this.#options.basePath, branch);

    try {
      const raw = await fs.promises.readFile(this.getFilePath(id), 'utf-8') as string;
      return this.#options.schema.parse(JSON.parse(raw));
    }
    catch (err: any) {
      if (err.code === 'ENOENT')
        return null;
      throw err;
    }
  }

  async list(branch?: string): Promise<z.infer<TSchema>[]> {
    await this.pull(this.#options.basePath, branch);

    try {
      const files = await fs.promises.readdir(this.#path) as string[];
      const items = await Promise.all(
        files
          .filter(f => f.endsWith('.json'))
          .map(f => fs.promises.readFile(path.join(this.#path, f), 'utf-8')),
      ) as string[];
      return items.map(json => this.#options.schema.parse(JSON.parse(json)));
    }
    catch (err: any) {
      if (err.code === 'ENOENT')
        return [];
      throw err;
    }
  }

  async query(opts: QueryOptions<z.infer<TSchema>> = {}, branch?: string): Promise<z.infer<TSchema>[]> {
    let results = await this.list(branch);

    if (opts.where) {
      results = results.filter(item => matchesWhere(item, opts.where!));
    }

    if (opts.orderBy) {
      if (typeof opts.orderBy === 'string') {
        const orderBy = opts.orderBy;
        results.sort((a, b) => (a[orderBy] < b[orderBy] ? -1 : 1));
      }
      else {
        const [key, dir] = Object.entries(opts.orderBy)[0]!;
        results.sort((a, b) => {
          const valA = a[key as keyof typeof a];
          const valB = b[key as keyof typeof b];
          return dir === 'desc'
            ? valB < valA ? -1 : 1
            : valA < valB ? -1 : 1;
        });
      }
    }

    if (typeof opts.offset === 'number') {
      results = results.slice(opts.offset);
    }

    if (typeof opts.limit === 'number') {
      results = results.slice(0, opts.limit);
    }

    return results;
  }

  async create<T extends z.infer<TSchema>>(data: Omit<T, 'id'>, scope?: string, branch?: string): Promise<T> {
    const validated = this.#options.schema.parse({
      id: createId(),
      ...data,
    });
    const filepath = this.getFilePath(validated.id);
    await fs.promises.mkdir(this.#path, { recursive: true });
    await fs.promises.writeFile(filepath, JSON.stringify(validated, null, 2));

    await this.add(this.#options.basePath, filepath);
    await this.commit(
      this.#options.basePath,
      {
        type: 'feat',
        scope,
        message: `added ${this.pathRel(this.#options.basePath, filepath)}`,
      },
      branch,
    );
    await this.push(this.#options.basePath, branch);

    return validated;
  }

  async update<T extends z.infer<TSchema>>(id: string, data: Partial<T>, scope?: string, branch?: string): Promise<T> {
    await this.pull(this.#options.basePath, branch);

    const filepath = this.getFilePath(id);
    const raw = await fs.promises.readFile(filepath, 'utf-8') as string;
    const updated = this.#options.schema.parse({
      ...JSON.parse(raw),
      ...data,
    });

    await fs.promises.writeFile(filepath, JSON.stringify(updated, null, 2));

    await this.add(this.#options.basePath, filepath);
    await this.commit(
      this.#options.basePath,
      {
        type: 'fix',
        scope,
        message: `updated ${this.pathRel(this.#options.basePath, filepath)}`,
      },
      branch,
    );
    await this.push(this.#options.basePath, branch);

    return updated;
  }

  async delete(id: string, scope?: string, branch?: string): Promise<void> {
    const filepath = this.getFilePath(id);
    await fs.promises.unlink(filepath);

    await this.remove(this.#options.basePath, filepath);
    await this.commit(
      this.#options.basePath,
      {
        type: 'chore',
        scope,
        message: `deleted ${this.pathRel(this.#options.basePath, filepath)}`,
      },
      branch,
    );
    await this.push(this.#options.basePath, branch);
  }
}
