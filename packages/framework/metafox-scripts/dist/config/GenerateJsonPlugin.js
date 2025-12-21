import webpack from 'webpack';
class GenerateJsonPlugin {
    constructor({ filename, value, replacer, space }) {
        this.filename = filename;
        this.value = value;
        this.replacer = replacer;
        this.space = space;
        this.plugin = { name: 'GenerateJsonPlugin' };
    }
    apply(compiler) {
        compiler.hooks.compilation.tap(this.plugin, (compilation) => {
            const json = JSON.stringify(this.value, this.replacer, this.space);
            compilation.hooks.processAssets.tap({
                name: this.plugin.name,
                stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
            }, assets => {
                assets[this.filename] = {
                    source: () => json,
                    size: () => json.length
                };
            });
        });
    }
}
export default GenerateJsonPlugin;
