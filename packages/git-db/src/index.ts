import type { z } from "zod";
import { GitDB, type GitDBOptions } from "./db";
import { type GitOptions } from "./git";

export type { GitOptions, GitDBOptions, GitDB }

export function createGitDB<TSchema extends z.ZodTypeAny>(options: GitDBOptions<TSchema>) {
    return new GitDB<TSchema>(options)
}

export { GitShell } from './shell'