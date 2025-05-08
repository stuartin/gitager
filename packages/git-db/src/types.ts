export interface GitOptions {
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
