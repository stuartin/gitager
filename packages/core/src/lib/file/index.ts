import { fs } from 'memfs'
import { z } from 'zod'
import path from 'node:path'
import { Git } from '../git'
import type { GitagerOptions } from '../..'

export type Primitive = string | number | boolean

export type FilterOps<T extends Primitive> = {
    equals?: T
    not?: T
    in?: T[]
    contains?: T extends string ? string : never
    startsWith?: T extends string ? string : never
    endsWith?: T extends string ? string : never
    lt?: T
    lte?: T
    gt?: T
    gte?: T
    regex?: string
    fuzzy?: string
}

export type Where<T> = {
    [K in keyof T]?: T[K] extends Primitive ? FilterOps<T[K]> : never
} & {
    AND?: Where<T>[]
    OR?: Where<T>[]
    NOT?: Where<T>[]
}

type QueryOptions<T> = {
    where?: Where<T>
    orderBy?: keyof T | { [K in keyof T]?: 'asc' | 'desc' }
    limit?: number
    offset?: number
}

function matches<T>(value: any, filter: FilterOps<any>): boolean {
    if (filter.equals !== undefined && value !== filter.equals) return false
    if (filter.not !== undefined && value === filter.not) return false
    if (filter.in && !filter.in.includes(value)) return false
    if (filter.contains && typeof value === 'string' && !value.includes(filter.contains)) return false
    if (filter.startsWith && typeof value === 'string' && !value.startsWith(filter.startsWith)) return false
    if (filter.endsWith && typeof value === 'string' && !value.endsWith(filter.endsWith)) return false
    if (filter.lt !== undefined && value >= filter.lt) return false
    if (filter.lte !== undefined && value > filter.lte) return false
    if (filter.gt !== undefined && value <= filter.gt) return false
    if (filter.gte !== undefined && value < filter.gte) return false
    if (filter.regex && typeof value === 'string') {
        const re = new RegExp(filter.regex)
        if (!re.test(value)) return false
    }
    if (filter.fuzzy && typeof value === 'string') {
        const score = fuzzyMatchScore(filter.fuzzy, value)
        if (score < 0.4) return false
    }
    return true
}

function fuzzyMatchScore(needle: string, haystack: string): number {
    needle = needle.toLowerCase()
    haystack = haystack.toLowerCase()
    let score = 0
    let i = 0
    for (const char of haystack) {
        if (char === needle[i]) {
            score++
            i++
        }
    }
    return score / needle.length
}

function matchesWhere<T>(item: T, where: Where<T>): boolean {
    const { AND, OR, NOT, ...fields } = where

    for (const key in fields) {
        const filter = fields[key as keyof T] as FilterOps<any>
        const val = item[key as keyof T]
        if (!matches(val, filter)) return false
    }
    if (AND && !AND.every(cond => matchesWhere(item, cond))) return false
    if (OR && !OR.some(cond => matchesWhere(item, cond))) return false
    if (NOT && NOT.some(cond => matchesWhere(item, cond))) return false

    return true
}

export class FileDB<TSchema extends z.ZodTypeAny> extends Git {

    private path: string

    constructor(
        private repoPath: string,
        private subPath: string = '/',
        private schema: TSchema,
        options: GitagerOptions
    ) {
        super(options)
        this.path = path.join(this.repoPath, this.subPath)
    }

    async init() {
        await this.clone(this.repoPath, this.options.git.url)
    }

    private getFilePath(id: string) {
        return path.join(this.path, `${id}.json`)
    }

    async findOne(id: string): Promise<z.infer<TSchema> | null> {
        await this.pull(this.repoPath)

        try {
            const raw = await fs.promises.readFile(this.getFilePath(id), 'utf-8') as string
            return this.schema.parse(JSON.parse(raw))
        } catch (err: any) {
            if (err.code === 'ENOENT') return null
            throw err
        }
    }

    async findMany(): Promise<z.infer<TSchema>[]> {
        await this.pull(this.repoPath)

        try {
            const files = await fs.promises.readdir(this.path) as string[]
            console.log({ files })
            const items = await Promise.all(
                files
                    .filter(f => f.endsWith('.json'))
                    .map(f => fs.promises.readFile(path.join(this.path, f), 'utf-8'))
            ) as string[]
            return items.map(json => this.schema.parse(JSON.parse(json)))
        } catch (err: any) {
            if (err.code === 'ENOENT') return []
            throw err
        }
    }

    async query(opts: QueryOptions<z.infer<TSchema>> = {}): Promise<z.infer<TSchema>[]> {
        let results = await this.findMany()

        if (opts.where) {
            results = results.filter(item => matchesWhere(item, opts.where!))
        }

        if (opts.orderBy) {
            if (typeof opts.orderBy === 'string') {
                const orderBy = opts.orderBy
                results.sort((a, b) => (a[orderBy] < b[orderBy] ? -1 : 1))
            } else {
                const [key, dir] = Object.entries(opts.orderBy)[0]!
                results.sort((a, b) => {
                    const valA = a[key as keyof typeof a]
                    const valB = b[key as keyof typeof b]
                    return dir === 'desc'
                        ? valB < valA ? -1 : 1
                        : valA < valB ? -1 : 1
                })
            }
        }

        if (typeof opts.offset === 'number') {
            results = results.slice(opts.offset)
        }

        if (typeof opts.limit === 'number') {
            results = results.slice(0, opts.limit)
        }

        return results
    }

    async write(id: string, data: z.infer<TSchema>): Promise<void> {
        const filepath = this.getFilePath(id)
        await fs.promises.mkdir(this.path, { recursive: true })
        const validated = this.schema.parse(data)
        await fs.promises.writeFile(filepath, JSON.stringify(validated, null, 2))

        await this.add(this.repoPath, filepath)
        await this.commit(this.repoPath, {
            type: 'feat',
            message: `added ${path.relative(this.repoPath, filepath)}`
        })
        await this.push(this.repoPath)
    }

    async delete(id: string): Promise<void> {
        const filepath = this.getFilePath(id)
        await fs.promises.unlink(filepath)

        await this.add(this.repoPath, filepath)
        await this.commit(this.repoPath, {
            type: 'chore',
            message: `deleted ${path.relative(this.repoPath, filepath)}`,
        })
        await this.push(this.repoPath)
    }
}
