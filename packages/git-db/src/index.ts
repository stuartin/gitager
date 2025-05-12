import { GitDB, type GitDBOptions } from "./db";

export type { GitDBOptions }

export function createDB(options: GitDBOptions) {
    return new GitDB(options)
}