import { GitDB, type GitDBOptions } from "./db";
import { type GitOptions } from "./git";

export type { GitOptions, GitDBOptions, GitDB }

export function createGitDB(options: GitDBOptions) {
    return new GitDB(options)
}