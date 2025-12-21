/**
 * @type: service
 * name: ItemDetailInteractionInModal
 * depends: @metafox/feed
 */

import { connect, mapStateToProps } from '@metafox/framework';
import loadable from '@loadable/component';

const BaseView = loadable(
  () =>
    import(
      '../components/ItemDetailInteractionInModal/ItemDetailInteractionInModal'
    )
);
export default connect(mapStateToProps)(BaseView);
