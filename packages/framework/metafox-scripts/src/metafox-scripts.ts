#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

process.on('unhandledRejection', err => {
  throw err;
});

import bundlePackage from './lib/bundle-package.js';
import processBuildApp from './lib/processBuildApp.js';
import reloadDev from './lib/reload.js';
import bootstrap from './lib/bootstrap.js';
import runUnittest from './jest/jest-unittest.js';
import exportSourceCode from './lib/export-source.js';
import buildPackage from './lib/build-package.js';
import startDev from './lib/start-dev.js';
import buildApp from './lib/build-app.js';

yargs(hideBin(process.argv))
  .middleware(argv => {
    process.env.MFOX_BUILD_PROFILE = (argv.profile as string) || 'metafox';
    process.env.MFOX_BUILD_TYPE = (argv.type as string) || 'web';
    process.env.NODE_ENV = argv.production ? 'production' : 'development';
    process.env.BABEL_ENV = process.env.NODE_ENV;
  })
  .command(
    'start',
    'Start development server',
    {
      profile: { describe: 'build profile', type: 'string' },
      type: {
        describe: 'build type: admincp, web, installation',
        type: 'string',
        default: 'web'
      },
      production: {
        describe: 'development mode ?',
        type: 'boolean',
        default: false
      },
      analyzer: {
        type: 'boolean',
        describe: 'run in analyzer mode in localhost:8888',
        default: false
      }
    },
    startDev
  )
  .command(
    'build',
    'Build production release',
    {
      profile: {
        description: 'profile name',
        type: 'string'
      }
    },
    buildApp
  )
  .command(
    'package:bundle [package]',
    'Bundle a package',
    {
      publish: {
        describe: 'Publish to store ?',
        type: 'boolean',
        default: false
      },
      target: {
        describe: 'Where to extract packages',
        type: 'string',
        required: true
      },
      package: {
        describe: 'Where to extract packages',
        type: 'string',
        required: true
      }
    },
    bundlePackage
  )
  .command(
    'build:process',
    'Process build single task',
    {
      profile: {
        description: 'profile name',
        type: 'string'
      },
      type: {
        description: 'build type',
        type: 'string'
      },
      debug: {
        describe: 'upload method',
        type: 'boolean',
        default: false
      }
    },
    processBuildApp
  )
  .command(
    'reload',
    'Reload project Settings',
    {
      profile: {
        describe: 'build name',
        type: 'string'
      },
      type: {
        describe: 'type=web, admincp, install',
        type: 'string'
      }
    },
    reloadDev
  )
  .command('bootstrap', 'Bootstrap project', {}, bootstrap)
  .command('export', 'Export source code', {}, exportSourceCode)
  .command('build-package', 'Build package', {}, buildPackage)
  .command('jest-unittest', 'Jest test', {}, runUnittest)
  .parse();
