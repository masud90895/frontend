import fs from 'fs';
import path from 'path';
import workbox from '../workbox.js';
import createJestConfig from './createJestConfig.js';

const isWorkspace = fs.existsSync(path.resolve(process.cwd(), 'packages'));
const packageJson = workbox.readJson(
  path.resolve(process.cwd(), './package.json')
);

const rootDir = workbox.getRootDir();

const jestConfig = createJestConfig({
  isWorkspace,
  rootDir,
  packageName: packageJson.name,
  relativePath: path.resolve(process.cwd()).substring(rootDir.length + 1)
});

export default jestConfig;
