import { GitShell } from "../../../../packages/git-db/src/shell";
import 'dotenv/config'


async function main() {
    const shell = new GitShell({
        user: 'oauth2',
        token: process.env.GIT_TOKEN!,
        url: process.env.GIT_URL!,
    })


    await shell.init()
    await shell.debug()
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        process.exit(0);
    });
