/**
 * Forward process call to multiple target
 */
import chalk from 'chalk';
import child_process from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import getPaths from '../config/paths.js';
import concurrently from 'concurrently';
const paths = getPaths();
const workingDir = path.resolve(process.cwd(), 'app');
function cleanupDistDirectory() {
    const distDir = path.resolve(workingDir, 'dist');
    fs.emptyDirSync(distDir);
    fs.ensureDirSync(distDir);
    fs.copySync(path.resolve(workingDir, 'public'), distDir);
    fs.ensureDirSync(path.resolve(distDir, 'admincp'));
}
function handleBuildProcess({ label, command, args, env }) {
    console.log(`building ${label}...`);
    // start admin web server
    const child = child_process.spawn(command, args, {
        cwd: process.cwd(),
        env
    });
    return new Promise((resolve, reject) => {
        child.stdout.on('data', (data) => {
            console.log(`${data}`);
        });
        child.stderr.on('data', data => {
            console.error(`${data}`);
        });
        child.on('close', (code) => {
            if (!code) {
                console.log(`Build ${label} completed successfully`);
                resolve();
            }
            else {
                console.log(`Build ${label} exited ${code}`);
                reject(new Error(`Process ${label} exited ${code}`));
            }
        });
    });
}
export function prepareDirectory() {
    const start = new Date().getTime();
    cleanupDistDirectory();
    const spend = (new Date().getTime() - start) / 1000;
    console.log(chalk.cyan(`Cleanup directory in ${spend}`));
}
export default async function buildApp(options) {
    const { profile = '' } = options;
    const appBuild = paths.appBuild;
    const distDir = path.resolve(workingDir, 'dist');
    const outputDir = process.env.MFOX_OUTPUT_DIR;
    const start = new Date().getTime();
    const onFailure = async (err) => {
        console.log(`build error ${err.message}`);
        console.error(err);
    };
    const onComplete = async () => {
        fs.writeFileSync(`${appBuild}/bundle-success.log`, Date.now().toString(), {
            encoding: 'utf-8'
        });
        if (outputDir) {
            console.log(`Copy dist from ${distDir} to ${outputDir}`);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            fs.copySync(distDir, outputDir);
        }
        console.log('Build Successfully');
    };
    console.log(chalk.cyan('bundle packages'));
    prepareDirectory();
    const { result } = concurrently([
        {
            command: `metafox build:process --type=web --profile=${profile}`,
            name: 'web',
            prefixColor: 'cyan',
            env: {
                ...process.env,
                MFOX_BUILD_TYPE: 'web'
            }
        },
        {
            command: 'metafox build:process --type=admincp --profile=' + profile,
            name: 'admincp',
            prefixColor: 'magenta',
            env: {
                ...process.env,
                MFOX_BUILD_TYPE: 'admincp'
            }
        }
    ]);
    return result
        .then(onComplete)
        .catch(onFailure)
        .finally(() => {
        console.log('Build completed');
        const spend = (new Date().getTime() - start) / 1000;
        console.log(chalk.cyan(`Build spend ${spend} seconds`));
    });
}
