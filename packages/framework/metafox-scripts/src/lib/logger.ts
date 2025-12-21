import chalk from 'chalk';
import { isArray, isPlainObject, map } from 'lodash-es';
import os from 'os';

const logger = {
  info(...args: any) {
    const format = [chalk.cyan, chalk.green, chalk.blue];

    const message = map(args, (x, index) => {
      if (isPlainObject(x)) {
        x = JSON.stringify(x, null, '  ');
      }
      return format[index % 3](x);
    }).join(' ');

    console.log(message);
  },

  error(...args: any) {
    const format = [chalk.redBright, chalk.green, chalk.blue];

    const message = map(args, (x, index) => {
      if (isPlainObject(x)) {
        x = JSON.stringify(x, null, '  ');
      }
      return format[index % 3](x);
    }).join(' ');

    console.log(message);
  },

  format(x: any) {
    if (!x) {
      return '';
    }

    if (isArray(x)) {
      return `[${x.join(', ')}]`;
    }

    if (isPlainObject(x)) {
      return JSON.stringify(x);
    }
    return x;
  },

  dump(data: any) {
    Object.keys(data).forEach((k: string) => {
      this.info(`${k}:`, this.format(data[k]));
    });
  },
  dashLines() {
    console.log(chalk.green('-'.repeat(60)));
  },
  heading(message: string) {
    console.log(os.EOL);
    console.log(chalk.blueBright('*'.repeat(60)));
    console.log(chalk.blueBright(message));
    console.log(chalk.blueBright('*'.repeat(60)));
  }
};

export default logger;
