/**
 * @type: block
 * name: user.block.userListingBlock
 * title: User Items
 * keywords: user
 * description: Display user items
 * thumbnail:
 */
import { createBlock, ListViewBlockProps } from '@metafox/framework';
import Base from './Base';

const UserListingBlock = createBlock<ListViewBlockProps>({
  extendBlock: Base,
  name: 'UserListingBlock',
  overrides: {
    dataSource: {
      apiUrl: '/user'
    },
    contentType: 'user'
  },
  defaults: {
    title: 'members',
    itemView: 'user.itemView.mainCard',
    blockLayout: 'Main Listings',
    gridLayout: 'Friend - Cards',
    itemLayout: 'Friend - Cards'
  }
});

export default UserListingBlock;
