import load from '@loadable/component';

export const SmartDataGrid = load(
  () =>
    import(
      /* webpackChunkName: "dataGrid"  */
      './SmartDataGrid/DataGrid'
    )
);
