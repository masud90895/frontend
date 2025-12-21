import fs from 'fs';
import path from 'path';
import logger from './logger.js';
import workbox from '../workbox.js';
/**
 *
 * @param {*} dir
 * @param {*} files
 * @returns string[]
 */
function getFiles(dir, files) {
    if (!files) {
        files = [];
    }
    const dirs = fs.readdirSync(dir, { withFileTypes: true });
    for (const dirent of dirs) {
        const res = path.resolve(dir, dirent.name);
        if (dirent.isDirectory()) {
            getFiles(res, files);
        }
        else {
            files.push(res);
        }
    }
    return files;
}
export default function bundlePackage({ package: packageName, target: extractPath }) {
    const packageJson = require.resolve(`${packageName}/package.json`);
    if (!packageJson) {
        throw new Error('package not found ');
    }
    const { name, version } = workbox.readJson(packageJson);
    const reg = /^(\@?)(.+)\/(.+)$/;
    const filename = name.replace(reg, '$2-$3') + `-${version}.zip`;
    const paths = {
        packageJson,
        filename,
        packageRoot: path.dirname(require.resolve(`${packageName}/package.json`)),
        root: process.cwd()
    };
    const prefixLength = paths.root.length + 1;
    const files = getFiles(paths.packageRoot, []);
    files.forEach(file => {
        const local = path.join(extractPath, 'frontend', file.substring(prefixLength));
        if (!fs.existsSync(path.dirname(local))) {
            fs.mkdirSync(path.dirname(local), { recursive: true });
        }
        logger.info('Extracted to ', local);
        fs.copyFileSync(file, local);
    });
    logger.heading('Extracted to ' + extractPath);
}
