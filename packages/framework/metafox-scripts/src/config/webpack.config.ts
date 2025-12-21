import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';
import workbox from '../workbox.js';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import GenerateJsonPlugin from './GenerateJsonPlugin.js';
import MomentLocalesPlugin from 'moment-locales-webpack-plugin';
import logger from '../lib/logger.js';
import InterpolateHtmlPlugin from './InterpolateHtmlPlugin.js';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import ESLintWebpackPlugin, {
  Options as EslintOptions
} from 'eslint-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import getPaths from './paths.js';
import '../config/env.js';
import includeEnv from './includeEnv.js';
import { createRequire } from 'module';
import path from 'path';

const DEBUG = process.env.NODE_ENV == 'development';
const CI = !!process.env.CI;
const KB = 1024;
const WorkboxRootDir = workbox.getRootDir();

const includeEnvDef = Object.keys(includeEnv).reduce((acc, key) => {
  return {
    ...acc,
    [`process.env.${key}`]: JSON.stringify(includeEnv[key])
  };
}, {} as Record<string, string>);

// enable logs

const require = createRequire(import.meta.url);

// https://www.npmjs.com/package/eslint-webpack-plugin
const eslintConfig: EslintOptions = {
  cwd: WorkboxRootDir,
  errorOnUnmatchedPattern: true,
  useEslintrc: true,
  extensions: ['ts', 'tsx'],
  lintDirtyModulesOnly: true,
  emitError: true,
  emitWarning: true,
  failOnError: true,
  failOnWarning: false,
  quiet: false
};

const imageInlineSizeLimit = parseInt(
  process.env.IMAGE_INLINE_SIZE_LIMIT || '10000'
);

function getStyleLoaders(isProd: boolean, sourceMap = false) {
  return [
    isProd
      ? {
          loader: MiniCssExtractPlugin.loader,
          options: {}
        }
      : {
          loader: 'style-loader',
          options: {}
        },
    {
      loader: 'css-loader',
      options: {
        importLoaders: 1,
        sourceMap
      }
    },
    {
      loader: 'postcss-loader',
      options: {
        sourceMap: sourceMap,
        postcssOptions: {
          plugins: [
            require('postcss-normalize'),
            require('postcss-preset-env')({
              autoprefixer: {
                flexbox: 'no-2009'
              },
              stage: 3
            }),
            require('postcss-normalize')
          ]
        }
      }
    }
  ].filter(Boolean);
}

function getSwcLoader() {
  return {
    // $schema: 'https://json.schemastore.org/swcrc',
    loader: 'swc-loader',
    options: {
      jsc: {
        target: 'es2018',
        parser: {
          syntax: 'typescript',
          tsx: true,
          dynamicImport: true
        },
        // transform: null,
        // loose: false,
        // keepClassNames: false,
        experimental: {
          plugins: [
            ['@swc/plugin-loadable-components', {}],
            [
              '@swc/plugin-transform-imports',
              {
                lodash: {
                  transform: 'lodash/{{member}}',
                  preventFullImport: true
                },
                '@mui/icons-material': {
                  transform: '@mui/icons-material/{{member}}',
                  preventFullImport: true
                }
              }
            ]
          ]
        }
      },
      minify: true
    }
  };
}

function createWebpackConfig(): webpack.Configuration {
  const paths = getPaths();
  const isBuildService = !!process.env.MFOX_BUILD_SERVICE;
  const isProd = 'production' === process.env.NODE_ENV;
  const isDev = !isProd;
  const sourceMap = false;

  logger.heading('Build environment');
  if (!CI)
    console.table(
      Object.keys(includeEnv)
        .filter(key => /^(MFOX_|NODE_|BABEL_|PUBLIC_)/.test(key))
        .reduce((acc, x) => ({ ...acc, [x]: includeEnv[x] }), {})
    );

  const generateWebManifest = new GenerateJsonPlugin({
    filename: 'site.webmanifest',
    value: {
      name: process.env.MFOX_PWA_APP_NAME,
      description:
        process.env.MFOX_PWA_APP_DESCRIPTION ||
        process.env.MFOX_SITE_DESCRIPTION,
      start_url: '/',
      short_name: process.env.MFOX_PWA_APP_NAME || process.env.MFOX_SITE_NAME,
      display: process.env.MFOX_PWA_DISPLAY || 'standalone',
      publicPath: paths.publicPath,
      ...(process.env.MFOX_FAVICON_URL
        ? {
            icons: [
              {
                src: process.env.MFOX_FAVICON_URL,
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: process.env.MFOX_FAVICON_URL,
                sizes: '192x192',
                type: 'image/jpg'
              },
              {
                src: process.env.MFOX_FAVICON_URL,
                sizes: '64x64 32x32 24x24 16x16',
                type: 'image/x-icon'
              }
            ]
          }
        : {})
    }
  });

  return {
    // https://webpack.js.org/configuration/cache/#cache
    // disable webpack build cache
    cache: isDev,
    target: ['browserslist'],
    mode: process.env.NODE_ENV as webpack.Configuration['mode'],
    // performance: isDev,
    entry: {
      index: {
        import: paths.appIndexJs
        // dependOn: ['reactjs']
      }
      // reactjs: ReactJsGroup
    },
    output: {
      filename:
        isProd || process.env.MFOX_BUNDLE_ANALYZER
          ? 'static/js/[name].[contenthash:8].js'
          : 'static/js/bundle.[contenthash:8].js',
      chunkFilename:
        isProd && !process.env.MFOX_BUNDLE_ANALYZER
          ? 'static/js/[chunkhash:8].chunk.js'
          : 'static/js/[name].chunk.js',
      assetModuleFilename: 'static/media/[name].[contenthash:8][ext]',
      path: paths.appBuild,
      publicPath: paths.publicPath,
      pathinfo: isDev
    },
    infrastructureLogging: {
      level: (() => {
        if (DEBUG) return 'verbose';
        return isProd ? 'error' : 'verbose';
      })()
    },
    resolve: {
      modules: ['node_modules', path.resolve(process.cwd(), 'node_modules')],
      extensions: [
        '.web.mjs',
        '.mjs',
        '.web.js',
        '.js',
        '.web.ts',
        '.ts',
        '.web.tsx',
        '.tsx',
        '.json',
        '.web.jsx',
        '.jsx'
      ],
      alias: workbox.getModuleResolverAlias(),
      fallback: {
        'react/jsx-runtime': 'react/jsx-runtime.js',
        'react/jsx-dev-runtime': 'react/jsx-dev-runtime.js',
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        querystring: require.resolve('query-string')
      }
    },
    resolveLoader: {
      modules: ['node_modules']
    },
    module: {
      strictExportPresence: true,
      rules: [
        {
          oneOf: [
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              loader: require.resolve('url-loader'),
              options: {
                limit: imageInlineSizeLimit,
                name: 'static/media/[name].[hash:8].[ext]'
              }
            },
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              exclude: /node_modules/,
              resolve: {
                fullySpecified: false
              },
              use: [getSwcLoader()]
            },
            {
              test: /\.css$/,
              exclude: /\.module\.css$/,
              use: getStyleLoaders(isProd, sourceMap),
              sideEffects: true
            },
            {
              test: /\.svg$/,
              use: ['@svgr/webpack']
            },
            {
              loader: 'file-loader',
              exclude: /\.(js|mjs|jsx|ts|tsx|html|json)$/i,
              options: {
                name: 'static/media/[name].[hash:8].[ext]'
              }
            }
          ]
        }
      ]
    },
    plugins: [
      generateWebManifest,
      isProd && new WebpackManifestPlugin({}),
      new InterpolateHtmlPlugin({
        htmlWebpackPlugin: HtmlWebpackPlugin,
        replacements: includeEnv
      }),
      // https://webpack.js.org/plugins/progress-plugin/#root
      !isBuildService &&
        new webpack.ProgressPlugin({
          activeModules: false,
          entries: false,
          dependencies: false,
          profile: false,
          percentBy: 'modules'
        }),
      // https://webpack.js.org/plugins/eslint-webpack-plugin/
      isDev && !isBuildService && new ESLintWebpackPlugin(eslintConfig),
      // https://www.npmjs.com/package/moment-locales-webpack-plugin
      new MomentLocalesPlugin({
        localesToKeep: process.env.MFOX_LOCALE_SUPPORTS
          ? process.env.MFOX_LOCALE_SUPPORTS.split(',')
          : ['en'],
        ignoreInvalidLocales: true
      }),
      new HtmlWebpackPlugin({
        hash: false,
        template: paths.appHtml,
        inject: 'body',
        scriptLoading: 'defer', // {'blocking'|'defer'|'module'}
        title: process.env.APP_NAME
      }),
      new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash:8].css',
        chunkFilename: 'static/css/chunk-[contenthash:8].css'
      }),
      // isDev && new webpack.EvalSourceMapDevToolPlugin({}),
      !isBuildService &&
        process.env.MFOX_BUNDLE_ANALYZER &&
        new BundleAnalyzerPlugin({
          openAnalyzer: true,
          defaultSizes: 'gzip',
          analyzerPort: 8888,
          analyzerHost: '127.0.0.1'
        }),
      //require only SSR
      new webpack.DefinePlugin(includeEnvDef),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer']
      })
      // new webpack.ProvidePlugin({
      //   // do not remove me
      // })
    ].filter(Boolean),
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          parallel: true,
          minify: TerserPlugin.swcMinify,
          terserOptions: {
            format: {
              comments: false
            }
          },
          extractComments: false
        })
      ],
      emitOnErrors: true,
      chunkIds: 'named',
      // moduleIds: 'named',
      nodeEnv: isProd ? 'production' : 'development',
      mangleWasmImports: false,
      removeAvailableModules: true,
      removeEmptyChunks: true,
      mergeDuplicateChunks: false,
      flagIncludedChunks: true,
      // https://webpack.js.org/plugins/split-chunks-plugin/#splitchunksmaxasyncrequests
      splitChunks: {
        // chunks: 'async',
        minSize: 100 * KB,
        maxSize: 500 * KB,
        maxInitialSize: 500 * KB,
        maxAsyncSize: 500 * KB,
        // minChunks: 1,
        hidePathInfo: true,
        // minRemainingSize: 0,
        // maxAsyncRequests: 16,
        maxInitialRequests: 8,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/](react|react-dom|@metafox\/framework\/app|react-router|react-intl|@formatjs|lodash|axios|fbjs)[\\/]/,
            name: 'vendor',
            chunks: 'initial', // async, all, initial
            // maxSize: 500 * KB, // package not yet minify,
            minSize: 30 * KB
          },
          mui: {
            test: /[\\/]node_modules[\\/](@mui\/material|@mui\/styles|@mui\/system)[\\/]/,
            name: 'material',
            chunks: 'initial', // async, all, initial
            // maxSize: 500 * KB, // package not yet minify,
            minSize: 30 * KB
          },
          commons: {
            test: /[\\/]node_modules[\\/](formik|react-redux|immer|react-router-dom|redux|@redux-saga|@reduxjs|pusher-js|moment|date-fns|immutable|@popperjs|laravel-echo|numeral)[\\/]/,
            name: 'commons',
            chunks: 'initial', // async, all, initial
            // maxSize: 500 * KB, // package not yet minify,
            minSize: 30 * KB
          },
          app: {
            test: /[\\/]src[\\/]bundle-web[\\/]/,
            name: 'app',
            // initial allow dynamic import
            chunks: 'initial' // async, all, initial
          }
        }
      },
      runtimeChunk: {
        name: (entry: any) => `runtime-${entry.name}`
      }
    }
  };
}

export default createWebpackConfig;
