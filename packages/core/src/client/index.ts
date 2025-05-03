import type { GitagerApp } from '..'
import { hc } from 'hono/client'

export type Client = ReturnType<typeof createClient>

export function createClient(url: string) {
    return hc<GitagerApp>(url)
}