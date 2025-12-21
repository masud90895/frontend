// Do this as the first thing so that any code reading it knows the right env.

process.env.PUBLIC_URL = '';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

// Ensure environment variables are read.
import fs from 'fs';
import chalk from 'chalk';
import Webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import address from 'address';

function formatUrlHref({
  protocol,
  host,
  port,
  pathname
}: {
  protocol: string;
  host: string;
  port: string;
  pathname: string;
}): string {
  const _url = new URL('http://localhost');
  _url.protocol = protocol;
  _url.hostname = host;
  _url.port = String(port);
  _url.pathname = pathname;

  return _url.toString();
}

function prepareUrls(
  protocol: string,
  host: string,
  port: number,
  pathname = '/'
) {
  const formatUrl = (host: string) =>
    formatUrlHref({
      protocol,
      host,
      port: port.toString(),
      pathname
    });
  const prettyPrintUrl = (host: string) =>
    formatUrlHref({
      protocol,
      host,
      port: chalk.bold(port),
      pathname
    });

  const isUnspecifiedHost = host === '0.0.0.0' || host === '::';
  let prettyHost, lanUrlForConfig, lanUrlForTerminal;
  if (isUnspecifiedHost) {
    prettyHost = 'localhost';
    try {
      // This can only return an IPv4 address
      lanUrlForConfig = address.ip();
      if (lanUrlForConfig) {
        // Check if the address is a private ip
        // https://en.wikipedia.org/wiki/Private_network#Private_IPv4_address_spaces
        if (
          /^10[.]|^172[.](1[6-9]|2[0-9]|3[0-1])[.]|^192[.]168[.]/.test(
            lanUrlForConfig
          )
        ) {
          // Address is private, format it for later use
          lanUrlForTerminal = prettyPrintUrl(lanUrlForConfig);
        } else {
          // Address is not private, so we will discard it
          lanUrlForConfig = undefined;
        }
      }
    } catch (_e) {
      // ignored
    }
  } else {
    prettyHost = host;
  }
  const localUrlForTerminal = prettyPrintUrl(prettyHost);
  const localUrlForBrowser = formatUrl(prettyHost);
  return {
    lanUrlForConfig,
    lanUrlForTerminal,
    localUrlForTerminal,
    localUrlForBrowser
  };
}

import getPaths from '../config/paths.js';
import configFactory from '../config/webpack.config.js';
import workbox from '../workbox.js';

const paths = getPaths();

const PORT = parseInt(process.env.PORT as string, 10) || 3000;
const HOST = process.env.HOST || '127.0.0.1';

const proxy = fs.existsSync(paths.proxyJson)
  ? workbox.readJson(paths.proxyJson)
  : undefined;
const protocol = 'true' === process.env.HTTPS ? 'https' : 'http';

const urls = prepareUrls(
  protocol,
  HOST,
  PORT,
  paths.publicUrlOrPath.slice(0, -1)
);

const config = configFactory();

const disableFirewall =
  !proxy || process.env.DANGEROUSLY_DISABLE_HOST_CHECK === 'true';

const allowedHosts = disableFirewall ? 'all' : urls.lanUrlForTerminal;

const devServerOptions: WebpackDevServer.Configuration = {
  host: HOST,
  port: PORT,
  proxy,
  allowedHosts,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*'
  },
  // Enable gzip compression of generated files.
  compress: false,
  static: {
    directory: paths.appPublic,
    publicPath: paths.publicUrlOrPath,
    // By default files from `contentBase` will not trigger a page reload.
    watch: {
      ignored: ['/app/dist/']
    }
  },
  client: {
    webSocketURL: {
      hostname: process.env.WDS_SOCKET_HOST,
      pathname: process.env.WDS_SOCKET_PATH,
      port: process.env.WDS_SOCKET_PORT
    },
    overlay: {
      errors: true,
      warnings: false
    }
  },
  historyApiFallback: {
    disableDotRule: true,
    index: paths.publicUrlOrPath
  },
  open: true
};

const compiler = Webpack(config);

const devServer = new WebpackDevServer(devServerOptions, compiler);

// Launch WebpackDevServer.
devServer.startCallback(err => {
  if (err) {
    return console.log(err);
  }
  console.log(chalk.cyan('Starting the development server...\n'));
});

const stopServer = () =>
  devServer.stopCallback(() => {
    console.log('Server stopped.');
  });

['SIGINT', 'SIGTERM'].forEach(function (sig) {
  process.on(sig, function () {
    stopServer();
    process.exit();
  });
});

if ('true' !== process.env.CI) {
  // Gracefully exit when stdin ends
  process.stdin.on('end', function () {
    stopServer();
    process.exit();
  });
}
