/**
 * @type: block
 * name: setting.block.photo
 * title: User Settings - photo
 * keywords: user, settings
 * experiment: true
 */
import { connect, createBlock, GlobalState } from '@metafox/framework';
import Base from './Base';

const Enhancer = connect((state: GlobalState) => ({
  dataSource: state._actions.user.user.getPhotoSettings
}))(Base);

export default createBlock<any>({
  extendBlock: Enhancer,
  defaults: {
    testid: 'setting.block.photo',
    title: 'account_settings',
    blockLayout: 'Account Setting'
  }
});
