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
    protected defaultBranch: string

    private author = {
        name: 'gitager',
        email: 'bot@gitager.com'
    }

    constructor(
        protected options: GitOptions
    ) {
        this.defaultBranch = this.options.defaultBranch || 'main'
    }

    protected async clone(dir: string, url: string, branch?: string) {
        await git.clone({
            fs,
            http,
            dir,
            url,
            depth: 1,
            singleBranch: true,
            ref: branch || this.defaultBranch,
            onAuth: () => ({
                username: this.options.user,
                password: this.options.token
            })
        })
    }

    protected async pull(dir: string, branch?: string): Promise<void> {
        await git.pull({
            fs,
            http,
            dir,
            author: this.author,
            ref: branch || this.defaultBranch,
            onAuth: () => ({
                username: this.options.user,
                password: this.options.token
            })
        })
    }

    protected async add(dir: string, filepath: string) {
        const relativePath = this.pathRel(dir, filepath)
        await git.add({
            fs,
            dir,
            filepath: relativePath,
        })
    }

    protected async remove(dir: string, filepath: string) {
        const relativePath = this.pathRel(dir, filepath)
        await git.remove({
            fs,
            dir,
            filepath: relativePath,
        })
    }

    protected async commit(
        dir: string,
        options: {
            type: CommitType
            message: string,
            scope?: string
        },
        branch?: string
    ) {
        await git.commit({
            fs,
            dir,
            ref: branch || this.defaultBranch,
            message: `${commits[options.type]} ${options.type}${options.scope ? `(${options.scope}):` : ':'} ${options.message}`,
            author: this.author
        })
    }

    protected async push(dir: string, branch?: string) {
        await git.push({
            fs,
            http,
            dir,
            ref: branch || this.defaultBranch,
            onAuth: () => ({
                username: this.options.user,
                password: this.options.token
            })
        })
    }

    protected async log(dir: string, branch?: string) {
        return await git.log({
            fs,
            dir,
            depth: 5,
            ref: branch || this.defaultBranch
        })
    }

    private async logFileStatus(dir: string, filepath: string) {
        let status = await git.status({ fs, dir, filepath })
        console.log('status:', { filepath, status })
    }

    protected pathRel(dir: string, filepath: string) {
        // isomorphic git always expected POSIX paths
        // i.e folder/file.ext NOT folder\\file.ext
        return path.relative(dir, filepath).replace(/\\/g, '/');
    }
}