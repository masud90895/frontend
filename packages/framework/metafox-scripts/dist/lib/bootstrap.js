import chalk from 'chalk';
import { spawnSync } from 'child_process';
import workbox from '../workbox.js';
import path from 'path';
import fs from 'fs';
import { get, set } from 'lodash-es';
const availableScripts = [
    { key: 'scripts.test', value: 'metafox jest-unittest', override: false }
];
function fixWorkspacePackageJson() {
    workbox.getAllDevPackageJsonFiles().forEach(function (file) {
        const json = workbox.readJson(file);
        let modified = false;
        availableScripts.forEach(function ({ key, value, override }) {
            if (get(json, key) != value || override) {
                set(json, key, value);
                modified = true;
            }
        });
        if (modified) {
            workbox.writeJson(file, json);
        }
    });
}
function fixCompilerOptionsPaths() {
    const rootPath = workbox.getRootDir();
    const tsPathFile = path.resolve(rootPath, 'tsconfig.json');
    const json = workbox.readJson(tsPathFile);
    json.compilerOptions.paths = {};
    console.log(chalk.cyanBright('Fixing ./tsconfig.json ::compilerOptions.paths'));
    workbox
        .getAllPackages()
        .filter(pkg => {
        return (fs.existsSync(path.join(pkg.path, 'src')) &&
            fs.existsSync(path.join(pkg.path, 'tsconfig.json')));
    })
        .forEach(function (pkg) {
        const name = pkg.name;
        const dirname = path
            .resolve(pkg.path, 'src')
            .substring(rootPath.length)
            .replace(path.sep, '');
        json.compilerOptions.paths[name] = [`${dirname}`];
        json.compilerOptions.paths[`${name}/*`] = [`${dirname}/*`];
    });
    workbox.writeJson(tsPathFile, json);
}
/**
 * Bootstrap project
 */
export default function bootstrap() {
    console.log(chalk.cyan(`bootstrap ${workbox.getRootDir()}...`));
    spawnSync('pnpm', ['i'], {
        stdio: ['ignore', process.stdout, process.stderr]
    });
    fixCompilerOptionsPaths();
    fixWorkspacePackageJson();
}
