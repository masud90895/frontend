import HtmlWebpackPlugin from 'html-webpack-plugin';
import { EnvDictionary } from '../types';
import { Compiler } from 'webpack';

function escapeStringRegexp(str: string) {
  if (typeof str !== 'string') {
    throw new TypeError('Expected a string');
  }

  // Escape characters with special meaning either inside or outside character sets.
  // Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
  return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
}

export default class InterpolateHtmlPlugin {
  readonly htmlWebpackPlugin: typeof HtmlWebpackPlugin;
  readonly replacements: EnvDictionary;
  constructor({
    htmlWebpackPlugin,
    replacements
  }: {
    htmlWebpackPlugin: typeof HtmlWebpackPlugin;
    replacements: EnvDictionary;
  }) {
    this.htmlWebpackPlugin = htmlWebpackPlugin;
    this.replacements = replacements;
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap('InterpolateHtmlPlugin', compilation => {
      this.htmlWebpackPlugin
        .getHooks(compilation)
        .afterTemplateExecution.tap('InterpolateHtmlPlugin', data => {
          // Run HTML through a series of user-specified string replacements.
          Object.keys(this.replacements).forEach(key => {
            const value = this.replacements[key];
            data.html = data.html.replace(
              new RegExp('%' + escapeStringRegexp(key) + '%', 'g'),
              value as string
            );
          });
          return data;
        });
    });
  }
}
