import babelJest from 'babel-jest';
import { getModuleResolverAlias } from '../workbox.js';
import includeEnv from '../config/includeEnv.js';
export default babelJest.createTransformer({
    babelrc: false,
    configFile: false,
    presets: [
        ['@babel/preset-env'],
        ['@babel/preset-react'],
        ['@babel/preset-typescript']
    ],
    plugins: [
        [require('@babel/plugin-transform-flow-strip-types').default, false],
        [require('babel-plugin-macros')],
        [require('@babel/plugin-transform-optional-chaining').default],
        [require('@babel/plugin-transform-nullish-coalescing-operator').default],
        [require('@babel/plugin-proposal-decorators').default, false],
        [
            require('@babel/plugin-transform-class-properties').default,
            {
                loose: false
            }
        ],
        [require('@babel/plugin-transform-numeric-separator').default],
        [
            require('@babel/plugin-transform-runtime').default,
            {
                corejs: false
            }
        ],
        [
            // inject more variable here.
            'transform-inline-environment-variables',
            {
                include: Object.keys(includeEnv)
            }
        ],
        [
            require('babel-plugin-module-resolver').default,
            {
                extensions: ['.ts', '.tsx', '.js', '.jsx', '.es', '.es6', '.mjs'],
                alias: getModuleResolverAlias(),
                loglevel: 'silent'
            }
        ]
    ],
    overrides: []
});
