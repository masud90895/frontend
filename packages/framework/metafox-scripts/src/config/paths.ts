import path from 'path';
import fs from 'fs';
import { URL } from 'url';
import workbox from '../workbox.js';

// config after eject: we're in ./config/
function paths() {
  
  const IS_ADMINCP = process.env.MFOX_BUILD_TYPE === 'admincp';
  const IS_INSTALLATION = process.env.MFOX_BUILD_TYPE === 'installation';
  const IS_DEV = process.env.NODE_ENV !== 'production';

  const resolveApp = (relativePath: string) =>
    path.resolve(process.cwd(), 'app', relativePath);

  /**
   * Returns a URL or a path with slash at the end
   * In production can be URL, abolute path, relative path
   * In development always will be an absolute path
   * In development can use `path` module functions for operations
   *
   */
  function getPublicUrlOrPath(
    isEnvDevelopment: boolean,
    homepage: string | undefined,
    envPublicUrl: string | undefined
  ) {
    const stubDomain = 'http://localhost:300';

    if (envPublicUrl) {
      // ensure last slash exists
      envPublicUrl = envPublicUrl.endsWith('/')
        ? envPublicUrl
        : envPublicUrl + '/';

      // validate if `envPublicUrl` is a URL or path like
      // `stubDomain` is ignored if `envPublicUrl` contains a domain
      const validPublicUrl = new URL(envPublicUrl, stubDomain);

      if (isEnvDevelopment) {
        return envPublicUrl.startsWith('.') ? '/' : validPublicUrl.pathname;
      } else {
        // Some apps do not use client-side routing with pushState.
        // For these, "homepage" can be set to "." to enable relative asset paths.
        return envPublicUrl;
      }
    }

    if (homepage) {
      // strip last slash if exists
      homepage = homepage.endsWith('/') ? homepage : homepage + '/';

      // validate if `homepage` is a URL or path like and use just pathname
      const validHomepagePathname = new URL(homepage, stubDomain).pathname;
      if (isEnvDevelopment) {
        return homepage.startsWith('.') ? '/' : validHomepagePathname;
      } else {
        // Some apps do not use client-side routing with pushState.
        // For these, "homepage" can be set to "." to enable relative asset paths.
        return homepage.startsWith('.') ? homepage : validHomepagePathname;
      }
    }

    return '/';
  }

  function publicUrlOrPath(): string {
    let baseUrl = IS_DEV
      ? '/'
      : getPublicUrlOrPath(IS_DEV, undefined, process.env.PUBLIC_URL);

    if (IS_ADMINCP && !IS_DEV) {
      return `${baseUrl}admincp/`;
    }

    if (IS_INSTALLATION && !IS_DEV) {
      // baseUrl = `${baseUrl}install/`;
    }
    return baseUrl;
  }

  const moduleFileExtensions = [
    'web.mjs',
    'mjs',
    'web.js',
    'js',
    'web.ts',
    'ts',
    'web.tsx',
    'tsx',
    'json',
    'web.jsx',
    'jsx'
  ];

  // Resolve file paths in the same order as webpack
  const resolveModule = (
    resolveFn: (x: string) => string,
    filePath: string
  ) => {
    const extension = moduleFileExtensions.find(extension =>
      fs.existsSync(resolveFn(`${filePath}.${extension}`))
    );

    if (extension) {
      return resolveFn(`${filePath}.${extension}`);
    }

    return resolveFn(`${filePath}.js`);
  };

  const wsPath = path.resolve(workbox.getRootDir());

  return {
    wsPath,
    publicPath: IS_INSTALLATION ? 'auto' : publicUrlOrPath(),
    appBuild: resolveApp(`dist${publicUrlOrPath()}`),
    appPublic: resolveApp(process.env.MFOX_APP_PUBLIC ?? 'public'),
    appHtml: resolveApp(process.env.MFOX_APP_HTML ?? 'public/index.ejs.html'),
    appIndexJs: (() => {
      if (IS_ADMINCP) {
        return resolveModule(resolveApp, 'src/admincp');
      }
      if (IS_INSTALLATION) {
        return resolveModule(resolveApp, 'src/install');
      }
      return resolveModule(resolveApp, 'src/index');
    })(),
    appSettingJson: resolveApp(
      process.env.MFOX_SETTING_JSON ?? 'settings.json'
    ),
    proxyJson: resolveApp(process.env.MFOX_PROXY_FILE ?? 'proxy.json'),
    publicUrlOrPath: publicUrlOrPath()
  };
}

export default paths;
