import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node'
import { fs } from 'memfs'
import path from 'node:path';
import type { GitOptions } from './types';


type CommitType = 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'perf' | 'test' | 'build' | 'ci' | 'chore' | 'revert'
export const commits: Record<CommitType, string> = {
    feat: "✨",
    fix: "🐛",
    docs: "📝",
    style: "💄",
    refactor: "♻️",
    perf: "⚡️",
    test: "✅",
    build: "🏗️",
    ci: "👷",
    chore: "🔧",
    revert: "⏪️"
};

export class Git {
    private author = {
        name: 'gitager',
        email: 'bot@gitager.com'
    }

    constructor(
        protected options: GitOptions
    ) { }

    protected async clone(dir: string, url: string) {
        await git.clone({
            fs,
            http,
            dir,
            url,
            depth: 1,
            singleBranch: true,
            ref: this.options.branch || 'main',
            onAuth: () => ({
                username: this.options.user,
                password: this.options.token
            })
        })
    }

    protected async pull(dir: string): Promise<void> {
        await git.pull({
            fs,
            http,
            dir,
            author: this.author,
            onAuth: () => ({
                username: this.options.user,
                password: this.options.token
            })
        })
    }

    protected async add(dir: string, filepath: string) {
        const relativePath = path.relative(dir, filepath)
        await git.add({
            fs,
            dir,
            filepath: relativePath,
        })
    }

    protected async commit(
        dir: string,
        options: {
            type: CommitType
            scope?: string
            message: string,
        }
    ) {
        await git.commit({
            fs,
            dir,
            message: `${commits[options.type]} ${options.type}${options.scope ? `(${options.scope}):` : ':'} ${options.message}`,
            author: this.author
        })
    }

    protected async push(dir: string) {
        await git.push({
            fs,
            http,
            dir,
            onAuth: () => ({
                username: this.options.user,
                password: this.options.token
            })
        })
    }
}