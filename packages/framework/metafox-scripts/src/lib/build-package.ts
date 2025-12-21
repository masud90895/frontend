import { spawnSync } from 'child_process';
import fs from 'fs';
import workbox from '../workbox.js';
import path from 'path';

export default async function buildPackage() {
  const packageDir = process.cwd();
  const options = [];

  if (fs.existsSync(`${packageDir}/tsconfig.build.json`)) {
    options.push('--tsconfig', 'tsconfig.build.json');
  }
  if (!fs.existsSync(`${packageDir}/tsup.config.js`)) {
    options.push(
      '--config',
      path.resolve(workbox.getRootDir(), 'tsup.es5.config.js')
    );
  }

  spawnSync('tsup', options, {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
}
