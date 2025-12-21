import fs from 'fs';
import path from 'path';
import dotEnv from 'dotenv';

const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_PATH = process.env.APP_PATH || path.resolve(process.cwd(), 'app');

const profile = process.env.MFOX_BUILD_PROFILE || 'metafox';
const dotEnvFile = path.resolve(APP_PATH, '.env');

const envFile = [
  `${dotEnvFile}.${NODE_ENV}.${profile}.local`,
  `${dotEnvFile}.${NODE_ENV}.${profile}`,
  `${dotEnvFile}.${profile}.local`,
  `${dotEnvFile}.${profile}`,
  `${dotEnvFile}.${NODE_ENV}.local`,
  `${dotEnvFile}.${NODE_ENV}`,
  `${dotEnvFile}`
]
  .map(x => x.replace('..', '.'))
  .filter(Boolean)
  .find(fs.existsSync);

if (envFile) {
  dotEnv.config({ path: envFile });
  const buildType = process.env.MFOX_BUILD_TYPE;

  if (buildType === 'admincp') {
    const url = new URL(
      process.env.MFOX_ADMINCP_URL ?? '/admincp',
      'http://localhost'
    );

    console.log('basename', url.pathname);
    process.env.MFOX_ROUTE_BASE_NAME = url.pathname;
  } else if (buildType == 'installation') {
    process.env.MFOX_ROUTE_BASE_NAME = '/install';
  } else if (buildType === 'web') {
    //
  }

  if (process.env.MFOX_ROUTE_BASE_NAME === '/') {
    process.env.MFOX_ROUTE_BASE_NAME = '';
  }

  if (process.env.MFOX_SITE_URL === '/') {
    process.env.MFOX_SITE_URL = '';
  }

  if (process.env.MFOX_ADMINCP_URL === '/') {
    process.env.MFOX_ADMINCP_URL = '';
  }
}
