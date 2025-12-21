import child_process from 'child_process';
import path from 'path';
import reloadDev from './reload.js';
import { fileURLToPath } from 'url';

const file = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'start-dev-server.js'
);

/**
 * start webpack dev server
 */
function startWeb(tag: string, env: any, output: boolean = true) {
  const proc = child_process.spawn('node', [file], {
    env,
    cwd: process.cwd(),
    stdio: output ? ['ignore', process.stdout, process.stderr] : undefined
  });

  ['SIGINT', 'SIGTERM'].forEach(sig => {
    process.on(sig, () => {
      console.log(`terminating ${tag}`);
      proc.kill();
    });
  });
}

export default function startDev(argv: { analyzer?: boolean; type?: string }) {
  const { analyzer, type } = argv;

  reloadDev(argv);

  if (type === 'installation') {
    startWeb('install', {
      ...process.env,
      MFOX_BUILD_TYPE: 'installation',
      MFOX_BUNDLE_ANALYZER: analyzer ? 1 : undefined
    });
    return;
  }

  if (type === 'admincp') {
    startWeb('admincp', {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV,
      MFOX_BUILD_TYPE: 'admincp',
      MFOX_BUNDLE_ANALYZER: analyzer ? 1 : undefined
    });
    return;
  }

  startWeb('web', {
    ...process.env,
    MFOX_BUILD_TYPE: 'web',
    MFOX_BUNDLE_ANALYZER: analyzer ? 1 : undefined
  });

  if (!analyzer) {
    // startDev0();
  }
}
