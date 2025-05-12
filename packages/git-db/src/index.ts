import { GitDB, type GitDBOptions } from "./db";

export type { GitDBOptions }

export function createGitDB(options: GitDBOptions) {
    return new GitDB(options)
}