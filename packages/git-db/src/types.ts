export type GitOptions = {
    url: string;
    token: string;
    user?: string; // should be oauth2 if using github fine grained tokens
    defaultBranch?: string // what the default branch should be set to (defaults to main)
}