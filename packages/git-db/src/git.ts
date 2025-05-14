import path from 'node:path';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import { Volume, createFsFromVolume } from 'memfs';

export type GitOptions = {
  /**
   * The url pointing to the git repository
   */
  url: string;

  /**
   * The token to use to authenticate with git
   */
  token: string;

  /**
   * The username to use when authenticating with git.
   * For GitHub fine grained tokens, use oauth2
   */
  user?: string;

  /**
   * What the default branch should be
   * @default main
   */
  defaultBranch?: string;
}


type CommitType =
  | 'feat'
  | 'fix'
  | 'docs'
  | 'style'
  | 'refactor'
  | 'perf'
  | 'test'
  | 'build'
  | 'ci'
  | 'chore'
  | 'revert';

export const commits: Record<CommitType, string> = {
  feat: '✨',
  fix: '🐛',
  docs: '📝',
  style: '💄',
  refactor: '♻️',
  perf: '⚡️',
  test: '✅',
  build: '🏗️',
  ci: '👷',
  chore: '🔧',
  revert: '⏪️',
};

export class Git {
  vol = new Volume;
  fs = createFsFromVolume(this.vol);

  #options: GitOptions

  #author = {
    name: 'gitager',
    email: 'bot@gitager.com',
  };

  constructor(
    options: GitOptions,
  ) {
    this.#options = {
      ...options,
      defaultBranch: options.defaultBranch || 'main'
    }
  }

  protected async clone(dir: string, url: string = this.#options.url, branch?: string) {
    await git.clone({
      fs: this.fs,
      http,
      dir,
      url,
      depth: 1,
      singleBranch: true,
      ref: branch || this.#options.defaultBranch,
      onAuth: () => ({
        username: this.#options.user,
        password: this.#options.token,
      }),
    });
  }

  protected async pull(dir: string, branch?: string): Promise<void> {
    await git.pull({
      fs: this.fs,
      http,
      dir,
      author: this.#author,
      ref: branch || this.#options.defaultBranch,
      onAuth: () => ({
        username: this.#options.user,
        password: this.#options.token,
      }),
    });
  }

  protected async add(dir: string, filepath: string) {
    const relativePath = this.pathRel(dir, filepath);
    await git.add({
      fs: this.fs,
      dir,
      filepath: relativePath,
    });
  }

  protected async remove(dir: string, filepath: string) {
    const relativePath = this.pathRel(dir, filepath);
    await git.remove({
      fs: this.fs,
      dir,
      filepath: relativePath,
    });
  }

  protected async commit(
    dir: string,
    options: {
      type: CommitType;
      message: string;
      scope?: string;
    },
    branch?: string,
  ) {
    await git.commit({
      fs: this.fs,
      dir,
      ref: branch || this.#options.defaultBranch,
      message: `${commits[options.type]} ${options.type}${options.scope
        ? `(${options.scope}):`
        : ':'} ${options.message}`,
      author: this.#author,
    });
  }

  protected async push(dir: string, branch?: string) {
    await git.push({
      fs: this.fs,
      http,
      dir,
      ref: branch || this.#options.defaultBranch,
      onAuth: () => ({
        username: this.#options.user,
        password: this.#options.token,
      }),
    });
  }

  protected async log(dir: string, branch?: string) {
    return await git.log({
      fs: this.fs,
      dir,
      depth: 5,
      ref: branch || this.#options.defaultBranch,
    });
  }

  private async logFileStatus(dir: string, filepath: string) {
    const status = await git.status({ fs: this.fs, dir, filepath });
    console.log('status:', { filepath, status });
  }

  protected pathRel(dir: string, filepath: string) {
    // isomorphic git always expected POSIX paths
    // i.e folder/file.ext NOT folder\\file.ext
    return path.relative(dir, filepath).replace(/\\/g, '/');
  }
}
