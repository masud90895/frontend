import logger from './logger.js';
import fs from 'fs-extra';
import Webpack from 'webpack';
import reloadDev from './reload.js';

export default async function processBuildApp(
  options: Partial<{
    debug: boolean;
    profile: string;
    type: string;
  }>
): Promise<void> {
  const { debug, profile, type } = options;
  process.env.NODE_ENV = debug ? 'development' : 'production';

  // console.log(options);

  if (type) {
    process.env.MFOX_BUILD_TYPE = type;
  }

  if (profile) {
    process.env.MFOX_BUILD_PROFILE = profile;
  }

  logger.heading('PROCESS BUILD APP');

  // console.log(`copy from ${appPublic} to ${appBuild}`);
  // fs.copySync(appPublic, appBuild, {});

  logger.info('MFOX_BUILD_TYPE=', process.env.MFOX_BUILD_TYPE);
  logger.info('MFOX_BUILD_PROFILE=', process.env.MFOX_BUILD_PROFILE);

  reloadDev({ profile, type });

  logger.info('Waiting for webpack bundle ...');
  const configFactory = await import('../config/webpack.config.js');
  
  const config = configFactory.default();

  const compiler = Webpack(config);

  return new Promise<void>((resolve, reject) => {
    compiler.run(function (err: Error) {
      if (err) {
        console.error(err);
        return reject(err);
      }
      return resolve();
    });
  });
}
