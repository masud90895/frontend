import workbox from '../workbox.js';
import fs from 'fs';
import path from 'path';

type Options = {
  isWorkspace?: boolean;
  relativePath?: string;
};

function getRoots() {
  const rootDir = workbox.getRootDir();

  return workbox
    .getAllDevPackages()
    .filter(x => fs.existsSync(path.resolve(x, 'src')))
    .map(x => x.substring(rootDir.length + 1))
    .map(pattern => `<rootDir>/${pattern}/src`.replace(/\*$/, ''));
}

function getModuleNameMapper() {
  const rootDir = workbox.getRootDir();

  const mapper: Record<string, string> = {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/tests/jest/__mock__/jest-file-transformer.js',
    '\\.(css|less|scss)$': 'identity-obj-proxy'
  };

  workbox.getAllPackages().forEach(x => {
    const name = x.name;
    if (!fs.existsSync(path.resolve(x.path, 'src'))) {
      return;
    }
    const relativePath = path
      .resolve(x.path, 'src')
      .substring(rootDir.length + 1);

    mapper[`^${name}/(.*)$`] = `<rootDir>/${relativePath}/\$1`;
  });
  return mapper;
}

function getCollectCoverageFrom(opts: Options) {
  if (opts.isWorkspace) {
    return [
      'src/**/*.{js,jsx,ts,tsx}',
      '!**/*/*.d.ts',
      '!**/*/types.ts',
      '!**/*/types/*.ts',
      '!**/*/Loadable.*',
      '!**.*/serviceWorker.ts'
    ];
  }
  return [
    `<rootDir>/${opts.relativePath}/src/**/*.{js,jsx,ts,tsx}`,
    `<rootDir>/${opts.relativePath}/src/*.{js,jsx,ts,tsx}`
  ];
}

function getTestMatch(opts: Options) {
  if (opts.isWorkspace) {
    return [
      '**/__tests__|__specs__|tests|specs/**/*.[jt]s?(x)',
      '**/?(*.)+(spec|test).[tj]s?(x)'
    ];
  }
  return [
    `<rootDir>/${opts.relativePath}/**/__tests__|__specs__|tests|specs/**/*.[jt]s?(x)`,
    `<rootDir>/${opts.relativePath}/**/?(*.)+(spec|test).[tj]s?(x)`
  ];
}

const jestUtils = {
  getRootDir: workbox.getRootDir,
  getTestMatch,
  getRoots,
  getModuleNameMapper,
  getCollectCoverageFrom
};

export default jestUtils;
