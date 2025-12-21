function escapeStringRegexp(str) {
    if (typeof str !== 'string') {
        throw new TypeError('Expected a string');
    }
    // Escape characters with special meaning either inside or outside character sets.
    // Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
    return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
}
export default class InterpolateHtmlPlugin {
    constructor({ htmlWebpackPlugin, replacements }) {
        this.htmlWebpackPlugin = htmlWebpackPlugin;
        this.replacements = replacements;
    }
    apply(compiler) {
        compiler.hooks.compilation.tap('InterpolateHtmlPlugin', compilation => {
            this.htmlWebpackPlugin
                .getHooks(compilation)
                .afterTemplateExecution.tap('InterpolateHtmlPlugin', data => {
                // Run HTML through a series of user-specified string replacements.
                Object.keys(this.replacements).forEach(key => {
                    const value = this.replacements[key];
                    data.html = data.html.replace(new RegExp('%' + escapeStringRegexp(key) + '%', 'g'), value);
                });
                return data;
            });
        });
    }
}
