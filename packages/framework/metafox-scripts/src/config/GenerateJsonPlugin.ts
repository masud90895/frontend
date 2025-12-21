import webpack from 'webpack';

interface GenerateJsonPluginOptions {
  filename: string;
  value: any;
  replacer?: (key: string, value: any) => any;
  space?: string | number;
}

class GenerateJsonPlugin {
  private filename: string;
  private readonly value: any;
  private readonly replacer?: (key: string, value: any) => any;
  private readonly space?: string | number;
  private readonly plugin: { name: string };

  constructor({ filename, value, replacer, space }: GenerateJsonPluginOptions) {
    this.filename = filename;
    this.value = value;
    this.replacer = replacer;
    this.space = space;
    this.plugin = { name: 'GenerateJsonPlugin' };
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.compilation.tap(
      this.plugin,
      (compilation: webpack.Compilation) => {
        const json = JSON.stringify(this.value, this.replacer, this.space);

        compilation.hooks.processAssets.tap(
          {
            name: this.plugin.name,
            stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
          },
          assets => {
            (assets as any)[this.filename] = {
              source: () => json,
              size: () => json.length
            };
          }
        );
      }
    );
  }
}

export default GenerateJsonPlugin;
