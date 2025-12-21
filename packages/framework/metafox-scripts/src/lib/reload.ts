import fs from 'fs';
import { globSync } from 'glob';
import {
  flatten,
  intersection,
  isArray,
  isEqualWith,
  isPlainObject,
  mergeWith,
  omit,
  uniqBy,
  uniqueId
} from 'lodash-es';
import os from 'os';
import path from 'path';
import { BundleInfo, BundleStats, PackageInfo, RouteInfo } from '../types.js';
import workbox from '../workbox.js';
import {
  AssetMaps,
  basePackages,
  chunkByTypeMap,
  DYNAMIC_LOAD,
  loadableByTypeMap,
  PACKAGES,
  validViewTypes
} from './constants.js';
import getCommentedInfo from './getCommentedInfo.js';
import logger from './logger.js';

const CI = !!process.env.CI;

function mergeIntegration(objValue: unknown, srcValue: unknown) {
  if (isArray(objValue)) {
    return (objValue as any).concat(srcValue);
  }
}

function trimRoot(str: string) {
  return str.substring(workbox.getRootDir().length + 1);
}

function mixFrom(name: string, file: string): string {
  return `${name}/${file.replace(/.\w+$/, '')}`;
}

function mixSource(dir: string, file: string) {
  return path.resolve(dir, 'src', file);
}

function toJsonString(data: any): string {
  return JSON.stringify(data, null, '  ');
}

function checkScriptFile(
  pkg: PackageInfo,
  bundles: BundleInfo[],
  filename: string
) {
  const source = mixSource(pkg.path, filename);
  const info = getCommentedInfo(source);
  if (!info) return;

  info['theme'] = info['theme'] ?? pkg.theme;

  // if belong is not required
  if (info.depends && !intersection(info.depends, PACKAGES).length) {
    return;
  }

  bundles.push({
    ...info,
    from: mixFrom(pkg.name, filename),
    source,
    packageName: pkg.name
  });
}

/**
 * @check layout file
 */
function checkJsonFile(
  pkg: PackageInfo,
  bundles: BundleInfo[],
  type: string,
  filename: string,
  deduce?: boolean
) {
  const source = mixSource(pkg.path, filename);
  const readFile = fs.readFileSync(source, { encoding: 'utf-8' });
  let data;
  try {
    data = JSON.parse(readFile);
  } catch (err) {
    console.log(`JSON File Error: ${readFile}`);
  }

  // fix before v5.1.3 compatible.
  if (deduce && Object.keys(data).length === 1) {
    const name = Object.keys(data).shift();
    data = name && data[name];

    if (!data.info?.name) {
      data.info.name = name;
    }
    console.log(`DEDUCE ${name}: ` + filename);
    // update json file.
    writeToFile(source, data);
  }

  const info = data.info ?? {};
  info.theme = info.theme ?? pkg.theme;

  bundles.push({
    ...data.info,
    source,
    packageName: pkg.name,
    type
  });
}

function bundleSinglePackage(
  bundles: BundleInfo[],
  packageName: string,
  bundleType: string,
  acceptThemes?: string[]
) {
  const pkg = workbox.getPackageInfo(packageName);
  if (!pkg) return;

  let allowAssets = true;

  if (pkg.theme) {
    if (!acceptThemes?.includes(pkg.theme)) {
      allowAssets = false;
    }
  }
  globSync('**/*.{ts,tsx,js,jsx}', { cwd: `${pkg.path}/src` })
    .sort((a, b) => a.localeCompare(b))
    .forEach(filename => checkScriptFile(pkg, bundles, filename));

  if (allowAssets) {
    AssetMaps.forEach(x => {
      globSync(x.from, { cwd: `${pkg.path}/src` }).forEach((file: string) =>
        checkJsonFile(pkg, bundles, x.type, file, x.deduce)
      );
    });
  }

  // check file name
  const messages = mixSource(pkg.path, 'messages.json');

  if (fs.existsSync(messages)) {
    bundles.push({
      source: messages,
      packageName,
      type: 'message',
      from: 'messages.json',
      name: `${packageName}/messages.json`
    });
  }

  const adminMessages = mixSource(pkg.path, 'admincp.messages.json');

  if (fs.existsSync(adminMessages)) {
    bundles.push({
      source: adminMessages,
      packageName,
      type: 'message',
      from: `${packageName}/admincp.message.json`,
      name: `${packageName}/admincp.message.json`,
      bundle: 'admincp'
    });
  }
}

function capitalizeWord(str: string) {
  return str.substring(0, 1).toUpperCase() + str.substring(1);
}

function capitalizeCase(str: string) {
  return str
    ? str.replace('_', '.').split(/\W+/g).map(capitalizeWord).join('')
    : 'undefinedName';
}

function fixRoutePriority(priority: string, index: number): number {
  const value = priority ? parseInt(priority, 10) : index;
  return !isNaN(value) ? value : index;
}

function bundleAllPackages(
  bundle: BundleInfo[],
  packages: string[],
  bundleType: string
) {
  packages.forEach(packageName => {
    bundleSinglePackage(bundle, packageName, bundleType);
  });
}

function outputPath(str: string) {
  const rootDir = workbox.getRootDir();
  return '.' + str.substring(rootDir.length);
}

function chunkSingleTheme(
  theme: BundleInfo,
  originBundle: BundleInfo[],
  bundleType: string,
  dirname: string
) {
  const { name } = theme;

  chunkAllViews(
    {},
    originBundle,
    path.resolve(dirname, `theme.${theme.name}.views.tsx`),
    bundleType,
    theme.name
  );

  const bundle = JSON.parse(JSON.stringify(originBundle));

  bundleSinglePackage(bundle, theme.packageName, bundleType, [theme.name]);

  const dir = path.dirname(theme.source).substring(process.cwd().length + 1);

  const names = [
    'layout.templates',
    'layout.blocks',
    'layout.grids',
    'layout.items',
    'layout.noContents',
    'layout.pages',
    'layout.siteBlocks',
    'layout.siteDocks',
    'layout.intergration',
    'layout.siteFixedDocks'
  ];

  names.forEach(x => {
    if (!fs.existsSync(`${dir}/${x}.origin.json`)) {
      if (fs.existsSync(`${dir}/${x}.json`)) {
        fs.copyFileSync(`${dir}/${x}.json`, `${dir}/${x}.origin.json`);
      } else {
        writeToFile(`${dir}/${x}.json`, '{}');
        writeToFile(`${dir}/${x}.origin.json`, '{}');
      }
    }
    if (!fs.existsSync(`${dir}/${x}.json`)) {
      fs.writeFileSync(`${dir}/${x}.json`, '{}', {
        encoding: 'utf-8'
      });
    }
  });

  AssetMaps.forEach(asset => {
    writeToFile(
      `${dir}/${asset.to}`,
      getAssetForTheme(asset.type, bundle, bundleType, name).data
    );
  });

  const { data: siteDocks } = getSiteDockForTheme(bundle, bundleType, name);

  writeToFile(`${dir}/layout.siteDocks.origin.json`, siteDocks);

  const { data: siteFixedDocks } = getSiteFixedDockForTheme(
    bundle,
    bundleType,
    name
  );

  writeToFile(`${dir}/layout.siteFixedDocks.origin.json`, siteFixedDocks);

  names.forEach(x => {
    minimizeLayoutFile(`${dir}/${x}.origin.json`, `${dir}/${x}.json`);
  });

  const info = { ...theme, id: name, dir };
  // console.log('chunk theme package', theme.packageName);
  const destination = path.resolve(dirname, `theme.${name}.tsx`);

  writeToFile(destination, [
    `/* eslint-disable */`,
    `import theme from '${theme.from}';`,
    `export { views } from './theme.${name}.views';`,
    `export const info = ${toJsonString(info)};`,
    `export default theme;`
  ]);
}

/**
 * Chunk all theme resource to single one.
 * Theme must be recovery in to single one.
 * @param stats
 * @param pages
 * @param bundle
 * @param dirname
 * @param bundleType
 */
function chunkThemes(
  stats: BundleStats,
  bundle: BundleInfo[],
  bundleType: string,
  dirname: string
) {
  const themes = bundle.filter(
    x => x.type === 'theme' && x.bundle == bundleType
  );

  stats.themes = Object.keys(themes).length;

  themes.forEach(theme => chunkSingleTheme(theme, bundle, bundleType, dirname));
}

// trim custom if custom is the same origin
function minimizeLayoutFile(originFile: string, customFile: string) {
  const origin = JSON.parse(fs.readFileSync(originFile, { encoding: 'utf-8' }));
  const custom = JSON.parse(fs.readFileSync(customFile, { encoding: 'utf-8' }));

  let changed = false;
  Object.keys(custom).forEach(name => {
    if (origin[name] && isEqualWith(custom[name], origin[name])) {
      delete custom[name];
      changed = true;
    }
  });

  if (changed) {
    writeToFile(customFile, custom);
  }
}

/**
 * Chunk all theme resource to single one.
 * Theme must be recovery in to single one.
 * @param stats
 * @param bundle
 * @param dirname
 * @param bundleType
 */
function chunkThemeStyles(
  stats: BundleStats,
  bundle: BundleInfo[],
  dirname: string,
  bundleType: string
) {
  const themeStyles = bundle
    .filter(x => x.type === 'theme.styles')
    .filter(x => !x.bundle || x.bundle === bundleType);

  stats.styles = Object.keys(themeStyles).length;

  themeStyles.forEach(style => {
    const dir = path.dirname(style.source).substring(process.cwd().length + 1);
    const { name, theme } = style;
    const id = theme + ':' + name;
    const info = omit({ ...style, id, dir }, ['source']);

    const destination = path.resolve(
      dirname,
      `style.${name}.theme.${theme}.tsx`
    );

    writeToFile(destination, [
      `/* eslint-disable */`,
      `import style from '${style.from}';`,
      `export const info = ${JSON.stringify(info)};`,
      `export default style;`
    ]);
  });
}

function chunkMessages(
  stats: BundleStats,
  bundle: BundleInfo[],
  destination: string,
  bundleType?: string
) {
  let data = {};

  bundle
    .filter(x => x.type === 'message')
    .forEach(x => {
      data = Object.assign(data, workbox.readJson(x.source));
    });

  if (bundleType) {
    bundle
      .filter(x => x.type === 'message')
      .filter(x => x.bundle === undefined || x.bundle === bundleType)
      .forEach(x => {
        data = Object.assign(data, workbox.readJson(x.source));
      });
  }

  stats.messages = Object.keys(data).length;

  writeToFile(destination, data);
}

function chunkMessageJs(destination: string) {
  writeToFile(
    destination,
    filterChunkedOutput([
      "import messages from './messages.json';",
      injectConfigSource('messages')
    ])
  );
}

function discoverElements(
  name: string,
  types: string[],
  stats: BundleStats,
  bundle: BundleInfo[],
  basePath: string
) {
  const items = collectBundleItems(bundle, types, x => ({
    ...x,
    importName: uniqueId('bf')
  }));

  const blockFeatures = toLoadableObject(name, items);

  stats[name] = items.length;

  const destination = path.resolve(basePath, name + '.ts');

  writeToFile(
    destination,
    [
      filterChunkedOutput(blockFeatures),
      '// inject to config',
      `export default ${name};`
    ].join('\n')
  );
}

function toLoadableJSON(items: BundleInfo[], processItem: any) {
  return items.reduce((acc, x) => {
    const obj = processItem(x);
    if (obj) acc[x.name] = obj;
    return acc;
  }, {} as Record<string, string>);
}

function chunkPageLayouts(bundle: BundleInfo[], bundleType: string) {
  let pageFileMap: Record<string, string> = {};
  let pages: Record<string, string> = {};
  // write down to /dev0/pageFileMap

  bundle
    .filter(x => x.type === 'layout')
    .filter(x => x.bundle === bundleType)
    .forEach(x => {
      const filename = trimRoot(x.source);
      const config = workbox.readJson(x.source);
      Object.keys(config).forEach(page => {
        pageFileMap[page] = filename;
      });
      pages = Object.assign(pages, config);
    });

  writeToFile(workbox.getRootDir() + '/scripts/pages.map.json', pageFileMap);

  return pages;
}

function getAssetForTheme(
  type: string,
  bundle: BundleInfo[],
  bundleType: string,
  themeName: string
) {
  let fileMap: Record<string, string> = {};
  let data: Record<string, unknown> = {};
  // write down to /dev0/pageFileMap

  bundle
    .filter(x => x.type === type)
    .filter(x => x.bundle === bundleType || x.bundle === undefined)
    .filter(x => x.theme === undefined || x.theme == themeName)
    .forEach(x => {
      const filename = trimRoot(x.source);

      const name = x.name ?? path.basename(filename).replace(/\.json$/, '');
      if (type === 'assets.intergration') {
        data[name] = mergeWith(
          {},
          data[name],
          workbox.readJson(x.source),
          mergeIntegration
        );
      } else {
        data[name] = workbox.readJson(x.source);
      }
    });

  return {
    data,
    fileMap
  };
}

function getSiteDockForTheme(
  bundle: BundleInfo[],
  bundleType: string,
  themeName: string
) {
  let data: Record<string, boolean> = {};

  bundle
    .filter(x => x.type === 'siteDock')
    .filter(x => x.bundle === undefined || x.bundle === bundleType)
    .filter(x => x.theme === undefined || x.theme === themeName)
    .forEach(x => {
      data[x.name] = true;
    });

  return { data };
}

function getSiteFixedDockForTheme(
  bundle: BundleInfo[],
  bundleType: string,
  themeName: string
) {
  let data: Record<string, boolean> = {};

  bundle
    .filter(x => x.type === 'siteFixedDock')
    .filter(x => x.bundle === undefined || x.bundle === bundleType)
    .filter(x => x.theme === undefined || x.theme === themeName)
    .forEach(x => {
      data[x.name] = true;
    });

  return { data };
}

function chunkBlockInfo(
  stats: BundleStats,
  bundle: BundleInfo[],
  destination: string,
  bundleType: string
) {
  const items = collectBundleItems(bundle, ['block'], x => x);

  const blocks = toLoadableJSON(items, (x: BundleInfo) => ({
    ...x,
    source: undefined,
    admincp: x.admincp ?? x.bundle === 'admincp'
  }));

  // skip overload

  const source = filterChunkedOutput(
    [
      `import blockFeatures from './blockFeatures';`,
      `const info = {blocks: ${toJsonString(blocks)}, blockFeatures,};`,
      `export default info;`
    ].join('\n')
  );

  writeToFile(destination, source);
}

/**
 * @example injectConfigSource('routes', 'models')
 * @param {string} parameters
 * @return string
 */
function injectConfigSource(parameters: string): string {
  const body = parameters
    .split(',')
    .map((name: string) => name.trim())
    .map((name: string) => `config.${name}=${name};`)
    .join('\n    ');
  return `export default function injector(config: any) {
    ${body}
}`;
}

function prepareImports(items: BundleInfo[]) {
  return items
    .map(({ type, from, importName, ...info }) => {
      // should loadable or chunk?
      const lazy =
        (!!loadableByTypeMap[type] || info.chunkName) && info.lazy != false;

      const chunkName = info.chunkName ? info.chunkName : chunkByTypeMap[type];
      const cmt = chunkName ? `/* webpackChunkName: "${chunkName}" */` : '';

      if (lazy) {
        return `const ${importName} = load(() => import(${cmt} '${from}'));`;
      }
      return `import ${importName} from '${from}';`;
    })
    .join('\n');
}

function filterChunkedOutput(content: string | string[]): string {
  if (Array.isArray(content)) {
    content = content.join('\n');
  }

  if (content.indexOf('load(') > 0 || content.indexOf('React.lazy') > 0) {
    content = `import load from '${DYNAMIC_LOAD}';\n\n${content}`;
  }

  return `/* eslint-disable */\n${content}`;
}

function toLoadableArray(
  exportName: string,
  items: BundleInfo[],
  processItem: (x: BundleInfo) => any
): string {
  const processItems = flatten(items.map(processItem));

  let content = JSON.stringify(processItems, null, '  ');

  let imports = prepareImports(items);

  items.forEach(({ importName }) => {
    content = content
      .replaceAll(`"[${importName}]"`, importName as string)
      .replaceAll(`"<[${importName}] />"`, `<${importName} />`);
  });

  return `${imports}\nconst ${exportName} = ${content};`;
}

function toLoadableObject(exportName: string, items: BundleInfo[]) {
  let data = JSON.stringify(
    uniqBy(items, 'name').reduce((acc, x) => {
      acc[x.name] = `[${x.importName as string}]`;
      return acc;
    }, {} as Record<string, string>),
    null,
    '  '
  );

  let imports = prepareImports(uniqBy(items, 'name'));

  items.forEach(({ importName }) => {
    data = data.replace(`"[${importName}]"`, importName as string);
  });

  return `${imports}\n\n// export\nexport const ${exportName} = ${data};`;
}

function collectBundleItems(
  bundle: BundleInfo[],
  includeTypes: string[],
  naming: (x: BundleInfo) => BundleInfo,
  bundleType?: string,
  callback?: any,
  theme?: any
) {
  return Object.values(
    bundle
      .filter(x => includeTypes.includes(x.type))
      .filter(x => {
        return (
          (x.bundle === undefined ||
            bundleType === undefined ||
            x.bundle === bundleType) &&
          x.theme == theme
        );
      })
      .map(x => naming(x))
      .reduce((acc, x) => {
        acc[x.name] = x;
        return acc;
      }, {} as Record<string, BundleInfo>)
  )
    .map((x, index) => ({
      ...x,
      priority: fixRoutePriority(x.priority as unknown as string, index)
    }))
    .filter(callback ?? Boolean)
    .sort((a, b) => a.priority - b.priority);
}

function chunkRoutes(
  stats: BundleStats,
  bundle: BundleInfo[],
  destination: string,
  bundleType: string
) {
  const processItem = (x: BundleInfo) => {
    if (isArray(x.path)) {
      return x.path.map((p, index) => ({
        component: `[${x.importName}]`,
        path: p,
        name: x.name
      }));
    }
    return {
      component: `[${x.importName}]`,
      path: x.path,
      name: x.name
    };
  };

  const popoverHandlers: Record<string, RouteInfo> = {};

  bundle
    .filter(x => x.type === 'popover') // skip popover
    .filter(x => x.path)
    .forEach(x => {
      popoverHandlers[x.name] = {
        component: x.name,
        path: x.path
      };
    });

  const modalItems = collectBundleItems(
    bundle,
    ['modalRoute'],
    x => ({
      ...x,
      importName: uniqueId('d')
    }),
    bundleType
  );

  let routeItems = collectBundleItems(
    bundle,
    ['route'],
    x => ({
      ...x,
      importName: uniqueId('r')
    }),
    bundleType
  );

  stats.routes = routeItems.length;

  stats.modals = modalItems.length;

  const routes = toLoadableArray('routes', routeItems, processItem);

  const modals = toLoadableArray('modals', modalItems, processItem);

  const source = filterChunkedOutput(
    [
      '/* export routes */',
      routes,
      '/* export modal */',
      modals,
      '/* export popoverHandlers*/',
      `const popoverHandlers  = ${toJsonString(
        Object.values(popoverHandlers)
      )}`,
      injectConfigSource('routes, modals, popoverHandlers')
    ].join('\n')
  );

  writeToFile(destination, source);
}

function chunkAllViews(
  stats: BundleStats,
  bundle: BundleInfo[],
  destination: string,
  bundleType: string,
  theme?: string
) {
  const viewItems = collectBundleItems(
    bundle,
    validViewTypes,
    x => ({
      ...x,
      importName: uniqueId('v')
    }),
    bundleType,
    null,
    theme
  );

  const views = toLoadableObject('views', viewItems);

  stats.views = viewItems.length;

  const source = [
    filterChunkedOutput(views),
    '// inject to config',
    injectConfigSource('views')
  ].join('\n');

  writeToFile(destination, source);
}

function chunkAllServices(
  stats: BundleStats,
  bundle: BundleInfo[],
  destination: string
) {
  const named = 'services';
  const serviceItems = collectBundleItems(bundle, ['service'], x => ({
    ...x,
    importName: uniqueId('s')
  }));
  const services = toLoadableObject(named, serviceItems);

  stats.services = serviceItems.length;

  const source = [
    '/* eslint-disable */',
    filterChunkedOutput(services),
    '// inject to config',
    injectConfigSource(named)
  ].join('\n');

  writeToFile(destination, source);
}

function chunkAllMockedService(
  stats: BundleStats,
  bundle: BundleInfo[],
  destination: string
) {
  const named = 'mockServices';

  const mainServices = collectBundleItems(bundle, ['service'], x => ({
    ...x,
    importName: capitalizeCase(x.name)
  }));

  const mockServices = collectBundleItems(bundle, ['mockService'], x => ({
    ...x,
    importName: uniqueId('ms')
  })).concat(mainServices);

  const services = toLoadableObject(named, mockServices);

  stats.services = mockServices.length;

  const source = [
    '// THIS IS DEFAULT SERVICE FOR RUN TESTING',
    '// PLEASE DO NOT IMPORT INTO OTHER PLACE.',
    filterChunkedOutput(services),
    '// inject to config',
    `export default ${named}`
  ].join('\n');

  writeToFile(destination, source);
}

function chunkProduce(
  stats: BundleStats,
  bundle: BundleInfo[],
  destination: string,
  bundleType: string
) {
  // remove duplicated.

  const sagaItems = collectBundleItems(
    bundle,
    ['saga'],
    x => ({
      ...x,
      importName: uniqueId('sg')
    }),
    bundleType
  );
  const reducerItems = collectBundleItems(
    bundle,
    ['reducer'],
    x => ({
      ...x,
      importName: uniqueId('rd')
    }),
    bundleType
  );
  const sagas = toLoadableArray('sagas', sagaItems, x => `[${x.importName}]`);

  const reducers = toLoadableObject('reducers', reducerItems);

  const source = filterChunkedOutput(
    [sagas, reducers, injectConfigSource('reducers,sagas')].join('\n')
  );

  stats.reducers = reducerItems.length;
  stats.sagas = sagaItems.length;

  writeToFile(destination, source);
}

function writeToFile(filename: string, source: unknown) {
  const output = (() => {
    if (Array.isArray(source)) {
      return source.join(os.EOL);
    }

    if (isPlainObject(source)) {
      return JSON.stringify(source, null, '  ');
    }
    return (source as string).toString();
  })();

  // logger.info('Updated', outputPath(filename));

  fs.writeFileSync(filename, output + os.EOL, { encoding: 'utf-8' });
}

function chunkSettingFile(origin: any, destination: any) {
  const config = JSON.parse(JSON.stringify(origin));
  delete config.packages;

  const source = [
    '/* eslint-disable */',
    `const root = ${JSON.stringify(config, null, '  ')};`,
    '// inject root',
    injectConfigSource('root')
  ].join('\n');

  writeToFile(destination, source);
}

function chunkApp(name: string, type: string, filename: string) {
  const source = `
import $x2 from '${name}/${type}/settings';
import $x3 from '${name}/${type}/services';
import $x4 from '${name}/${type}/routes';
import $x5 from '${name}/${type}/message';
import $x6 from '${name}/${type}/views';
import $x7 from '${name}/${type}/produce';

const bundle = [$x2, $x3, $x4, $x5, $x6, $x7].reduce((acc, value) => {
  value(acc);

  return acc;
}, {});

export default bundle;
`;
  writeToFile(filename, source);
}

function chunkThemeSnippetEditor(
  bundle: BundleInfo[],
  destination: string,
  bundleType: string
) {
  const processItem = ({ importName, ...info }: BundleInfo) => {
    return {
      ...info,
      component: `[${importName}]`
    };
  };

  let items = collectBundleItems(
    bundle,
    ['theme.style.editor'],
    x => ({
      ...x,
      importName: capitalizeCase(x.name)
    }),
    bundleType
  );

  let themeSnippets = toLoadableArray('themeSnippets', items, processItem);

  // reorder theme snippet

  const source = filterChunkedOutput(`
/* export themeSnippets */
${themeSnippets}

export default themeSnippets;
`);

  writeToFile(path.resolve(destination, 'theme.style.editor.tsx'), source);
}

async function bundleFor({
  siteName,
  bundleDir,
  bundleType
}: {
  siteName: string;
  bundleDir: string;
  bundleType: string;
}): Promise<void> {
  // console.log(chalk.green('Analyzing configuration ...'));
  await import('../config/env.js');
  const settingFile = path.resolve(
    workbox.getRootDir(),
    'app',
    process.env.MFOX_SETTING_JSON ?? 'settings.json'
  );

  const bundles: BundleInfo[] = [];
  const siteInfo = workbox.getPackageInfo(siteName);

  if (!siteInfo) throw new Error(`Site ${siteName} not found`);

  const siteDir = path.resolve(siteInfo.path);

  const settings = workbox.readJson(settingFile);
  const packages: Record<string, string> = {
    ...basePackages,
    ...settings.packages
  };
  const stats: BundleStats = {};

  Object.keys(packages).forEach(name => {
    PACKAGES.push(name);
  });

  logger.heading(`Bundle site ${siteInfo.name} for ${bundleType}`);

  if (!CI)
    console.table({
      'bundle type': bundleType,
      'Site name': siteInfo.name,
      'Site path': outputPath(siteInfo.path),
      'Total Packages': Object.values(packages).length
    });

  const createPath = (fileName: string) =>
    path.resolve(siteDir, bundleDir, fileName);

  const discoverPath = createPath('');

  if (!fs.existsSync(discoverPath)) {
    fs.mkdirSync(discoverPath);
  }

  logger.heading('Package to bundling');
  if (!CI) console.table(PACKAGES);

  bundleAllPackages(bundles, PACKAGES, bundleType);
  // summary stats

  discoverElements(
    'blockFeatures',
    ['layoutBlockFeature'],
    stats,
    bundles,
    discoverPath
  );

  chunkPageLayouts(bundles, bundleType);

  chunkApp(siteName, `bundle-${bundleType}`, createPath('config.tsx'));
  chunkMessages(stats, bundles, createPath('messages.json'), bundleType);
  chunkThemes(stats, bundles, bundleType, path.resolve(siteDir, bundleDir));
  chunkThemeStyles(
    stats,
    bundles,
    path.resolve(siteDir, bundleDir),
    bundleType
  );
  chunkThemeSnippetEditor(
    bundles,
    path.resolve(siteDir, bundleDir),
    bundleType
  );
  chunkBlockInfo(stats, bundles, createPath('blockInfo.tsx'), bundleType);
  chunkMessageJs(createPath('message.tsx'));
  chunkRoutes(stats, bundles, createPath('routes.tsx'), bundleType);
  chunkAllViews(stats, bundles, createPath('views.tsx'), bundleType);
  chunkAllServices(stats, bundles, createPath('services.tsx'));
  chunkAllMockedService(stats, bundles, createPath('mockServices.tsx'));
  chunkProduce(stats, bundles, createPath('produce.tsx'), bundleType);
  chunkSettingFile(settings, createPath('settings.tsx'));
  // process chunked language.
  // console.log(chalk.cyan(JSON.stringify(stats, null, '  ')));
}

export default function buildBundle({
  profile,
  type: bundleType
}: {
  profile?: string;
  type?: string;
}) {
  if (!bundleType) {
    bundleType = process.env.MFOX_BUILD_TYPE ?? 'web';
  }

  const start = new Date().getTime();
  bundleFor({
    siteName: '@metafox/web',
    bundleDir: `src/bundle-${bundleType}`,
    bundleType
  });
  const spend = (new Date().getTime() - start) / 1000;
  logger.info('Updated build settings in', spend, 'seconds');
}
