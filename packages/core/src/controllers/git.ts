import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node'
import type { GitagerConfig } from '..';
import { fs } from 'memfs'
import z from "zod"
import type { PathLike } from 'memfs/lib/node/types/misc';
import path from "node:path"

const SettingsSchema = z.object({
    organization: z.object({
        name: z.string()
    })
});

export class Git {

    #config: GitagerConfig
    #settings: z.infer<typeof SettingsSchema> | undefined

    constructor(config: GitagerConfig) {
        this.#config = config
    }

    private async write(filePath: PathLike, data: unknown) {
        const dir = path.dirname(filePath.toString())
        await fs.promises.mkdir(dir, { recursive: true })
        await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), { encoding: "utf-8" })
    }

    async init() {
        await this.clone("/config", this.#config.gitUrl)

        try {
            const settingsFile = await fs.promises.readFile("/config/.gitager/settings.json", "utf-8")
            const settingsJSON = JSON.parse(settingsFile.toString());
            this.#settings = SettingsSchema.parse(settingsJSON);

        } catch (_) {

            this.#settings = {
                organization: {
                    name: 'gitager'
                }
            }

            await this.write("/config/.gitager/settings.json", this.#settings)
            await this.add("/config", ".gitager/settings.json")
            await this.commit("/config", "add settings.json")
            await this.push("/config")
        }

        console.log(this.#settings)
    }

    async clone(dir: string, url: string) {
        await git.clone({
            fs,
            http,
            dir,
            url,
            depth: 1,
            onAuth: () => ({
                username: this.#config.gitUser,
                password: this.#config.gitToken
            })
        })
    }

    async add(dir: string, filepath: string) {
        await git.add({
            fs,
            dir,
            filepath,
        })
    }

    async commit(dir: string, message: string) {
        await git.commit({
            fs,
            dir,
            message,
            author: {
                name: 'Gitager',
                email: "bot@gitager.com"
            },
        })
    }

    async push(dir: string) {
        await git.push({
            fs,
            http,
            dir,
            onAuth: () => ({
                username: this.#config.gitUser,
                password: this.#config.gitToken
            })
        })
    }
}