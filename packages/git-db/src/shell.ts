import { Git, type GitOptions } from "./git";
import { patchFs, patchRequire } from 'fs-monkey';

export class GitShell extends Git {

    #path = '/TEST'

    constructor(options: GitOptions) {
        super(options)
    }


    async init() {
        await this.clone(this.#path);
        patchFs(this.vol)
        patchRequire(this.vol, true)

    }


    async debug() {
        const files = await this.fs.promises.readdir(this.#path)
        console.log({ files })

        // const packageJSON = {
        //     [`${this.#path}/package.json`]: JSON.stringify({
        //         name: '@gitager/temp-package',
        //         dependencies: {
        //             plop: "^4.0.1"
        //         }
        //     })
        // }

        // this.vol.fromJSON(packageJSON)
        // const newFiles = await this.fs.promises.readdir(this.#path)
        // const packageContent = await this.fs.promises.readFile(`${this.#path}/package.json`, 'utf-8')
        // console.log({ newFiles, packageContent })

        const plopFile = `
        export default function (plop) {
            // controller generator
            plop.setGenerator('controller', {
                description: 'application controller logic',
                prompts: [{
                    type: 'input',
                    name: 'name',
                    message: 'controller name please'
                    }],
                    actions: [{
                        type: 'add',
                        path: 'src/{{name}}.js',
                        templateFile: 'plop-templates/controller.hbs'
                }]
                });
        };
        `
        await this.fs.promises.writeFile(`${this.#path}/plopfile.js`, plopFile, { encoding: 'utf-8' })
        const plopfile = await this.fs.promises.readFile(`${this.#path}/plopfile.js`, 'utf-8')
        console.log({ plopfile })

        const nodePlop = await import('node-plop')

        const plop = await nodePlop.default(`${this.#path}/plopfile.js`);
        console.log({ plop })



    }
}