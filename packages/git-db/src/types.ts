export type GitOptions = {
    url: string;
    token: string;
    user?: string; // should be oauth2 if using github fine grained tokens
    branch?: string // defaults to main
}