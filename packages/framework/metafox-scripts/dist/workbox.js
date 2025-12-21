import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import { get } from 'lodash-es';
function migratePaths() {
    const root = process.cwd();
    console.log(`root ${root}`);
    const json = JSON.parse(fs.readFileSync(`${root}/package.json`, { encoding: 'utf8' }));
    if (json.migratePaths) {
        Object.keys(json.migratePaths).forEach(from => {
            const old = `${root}/${from}`;
            const to = json.migratePaths[from];
            if (fs.existsSync(old)) {
                if (!to || fs.existsSync(`${root}/${to}`)) {
                    fs.rmdirSync(old, { recursive: true });
                    console.log(`remove directory ${from}`);
                }
            }
        });
    }
}
migratePaths();
/**
 * collect all workspace packages.
 * command: pnpm m list --json --depth -1
 *
 */
const allPackages = JSON.parse(execSync('pnpm m list --json --depth -1', { encoding: 'utf8' }));
const ROOT_PACKAGE_NAME = '@metafox/react';
allPackages.forEach(x => {
    x.theme = get(x, 'metafox.theme');
    x.dir = stripRootPath(x.path);
});
function stripRootPath(str) {
    return str.substring(process.cwd().length + 1);
}
function getRootDir() {
    const root = allPackages.find(x => x.name == ROOT_PACKAGE_NAME);
    if (!root) {
        throw new Error('Root package not found');
    }
    return root.path;
}
/**
 * Get package in packages directory
 * @returns
 */
function getAllDevPackages() {
    return allPackages.filter(x => x.name != ROOT_PACKAGE_NAME).map(x => x.path);
}
/**
 * get all packages
 * @returns
 */
function getAllPackages() {
    return allPackages;
}
function getAllDevPackageJsonFiles() {
    return getAllDevPackages().map(dir => `${dir}/package.json`);
}
function getModuleResolverAlias() {
    const alias = {};
    allPackages
        .filter(x => {
        return (fs.existsSync(`${x.path}/package.json`) &&
            fs.existsSync(`${x.path}/src`));
    })
        .forEach(function (x) {
        const name = x.name;
        alias[name] = path.resolve(x.path, 'src');
        alias[`${name}/*`] = path.resolve(x.path, 'src/*');
    });
    return alias;
}
function readJson(file) {
    return JSON.parse(fs.readFileSync(file, { encoding: 'utf8' }));
}
function writeJson(file, json) {
    fs.writeFileSync(file, JSON.stringify(json, null, '  ') + '\n', {
        encoding: 'utf8'
    });
}
function getPackageInfo(packageName) {
    const pkg = allPackages.find(x => x.name === packageName);
    if (!pkg)
        return undefined;
    const clone = { ...pkg };
    const pkgJsonPath = path.join(clone.path, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        clone.theme = get(pkgJson, 'metafox.theme');
    }
    return clone;
}
const workbox = {
    getRootDir,
    readJson,
    writeJson,
    getAllPackages,
    getAllDevPackages,
    getAllDevPackageJsonFiles,
    getModuleResolverAlias,
    getPackageInfo
};
export default workbox;
