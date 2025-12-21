/**
 * options:
 * - next/dynamic
 * - @loadable/component
 */
export const DYNAMIC_LOAD = '@loadable/component';
export const AssetMaps = [
    {
        from: '**/assets/no-contents/*.json',
        type: 'assets.noContents',
        to: 'layout.noContents.origin.json'
    },
    {
        from: `**/assets/pages/*.json`,
        type: 'layout',
        to: 'layout.pages.origin.json',
        deduce: true
    },
    {
        from: '**/assets/templates/*.json',
        type: 'template',
        to: 'layout.templates.origin.json'
    },
    {
        from: '**/assets/items/*.json',
        type: 'assets.items',
        to: 'layout.items.origin.json'
    },
    {
        from: '**/assets/grids/*.json',
        type: 'assets.grids',
        to: 'layout.grids.origin.json'
    },
    {
        from: '**/assets/blocks/*.json',
        type: 'assets.blocks',
        to: 'layout.blocks.origin.json'
    },
    {
        from: '**/assets/intergration/*.json',
        type: 'assets.intergration',
        to: 'layout.intergration.origin.json'
    }
];
export const PACKAGES = [];
export const basePackages = {
    '@metafox/framework': 'local',
    '@metafox/local-store': 'local',
    '@metafox/cookie': 'local',
    '@metafox/toast': 'local',
    '@metafox/json2yup': 'local',
    '@metafox/constants': 'local',
    '@metafox/dialog': 'local',
    '@metafox/form': 'local',
    '@metafox/form-elements': 'local',
    '@metafox/html-viewer': 'local',
    '@metafox/intl': 'local',
    '@metafox/ui': 'local',
    '@metafox/jsx': 'local',
    '@metafox/layout': 'local',
    '@metafox/normalization': 'local',
    '@metafox/rest-client': 'local',
    '@metafox/route': 'local',
    '@metafox/theme-default': 'local',
    '@metafox/admincp': 'local',
    '@metafox/utils': 'local',
    '@metafox/echo': 'local',
    '@metafox/lexical': 'local'
};
export const validViewTypes = [
    'block',
    'itemView',
    'dialog',
    'skeleton',
    'siteDock',
    'siteFixedDock',
    'ui',
    'embedView',
    'formElement',
    'popover'
];
export const validTypes = [
    ...validViewTypes,
    'themeProcessor',
    'route',
    'modalRoute',
    'saga',
    'theme',
    'reducer',
    'message',
    'service',
    'packages',
    'dependency',
    'layoutBlockFeature',
    'admincp.message',
    'mockService',
    'theme.style.editor',
    'theme.styles'
];
// loadable by type component.
export const loadableByTypeMap = {
    block: true,
    skeleton: true,
    itemView: false,
    dialog: true,
    ui: true,
    embedView: true,
    formElement: true,
    route: true,
    modalRoute: false,
    siteDock: true,
    siteFixedDock: true,
    saga: false,
    reducer: false,
    service: false,
    message: false,
    package: false,
    dependency: false,
    'theme.style.editor': true // don't be loadable lib.
};
export const chunkByTypeMap = {
    dialog: 'dialogs',
    route: 'routes',
    siteDock: 'boot',
    siteFixedDock: 'boot',
    modalRoute: 'modalRoutes'
};
