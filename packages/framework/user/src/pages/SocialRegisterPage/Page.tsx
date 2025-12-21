/**
 * @type: route
 * name: user.social.register
 * path: /social/register
 * bundle: web
 */
import {
  LOGGED_OUT,
  useGlobal,
  useResourceAction,
  LAYOUT_EDITOR_TOGGLE
} from '@metafox/framework';
import { Page } from '@metafox/layout';
import { compactData } from '@metafox/utils';
import * as React from 'react';

const APP_SOCIALITE = 'socialite';
const RESOURCE_SOCIALITE_AUTH = 'socialite_auth';

export default function SocialRegisterPage(props) {
  const {
    createPageParams,
    dispatch,
    createContentParams,
    getSetting,
    redirectTo,
    useSession,
    usePageParams,
    localStore
  } = useGlobal();
  const canRegister = getSetting('user.allow_user_registration');
  const { loggedIn } = useSession();
  const params = usePageParams();
  const isEditMode = loggedIn && localStore.get(LAYOUT_EDITOR_TOGGLE);

  if ((!canRegister || loggedIn) && !isEditMode) {
    redirectTo('/');
  }

  const config = useResourceAction(APP_SOCIALITE, RESOURCE_SOCIALITE_AUTH, 'getTermsForm');

  if (!isEditMode) {
    dispatch({ type: LOGGED_OUT });
  }

  const pageParams = createPageParams(props, () => ({
    pageMetaName: 'user.social.register',
    menuHeaderGuestLogin: true
  }));

  const contentParams = createContentParams({
    mainForm: {
      noBreadcrumb: true,
      successAction: 'user/socialite/register',
      dataSource: {
        apiUrl: config?.apiUrl,
        apiParams: compactData(config?.apiParams, params)
      }
    }
  });

  return (
    <Page
      pageName="user.social.register"
      contentParams={contentParams}
      pageParams={pageParams}
    />
  );
}
