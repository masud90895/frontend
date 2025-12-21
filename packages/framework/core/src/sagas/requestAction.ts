/**
 * @type: saga
 * name: requestAction
 */
import { put, takeLatest } from 'redux-saga/effects';
import {
  getGlobalContext,
  getResourceAction,
  handleActionConfirm,
  handleActionError,
  handleActionFeedback
} from '@metafox/framework';
import { Action } from 'redux-saga';

function* requestAction({
  payload
}: {
  type: 'confirmNextAction';
  payload: {
    action: {
      module_name: string;
      resource_name: string;
      action: string;
      cancelAction: Action;
      successAction: Action;
    };
  };
}) {
  const { action: actionConfig } = payload || {};
  const { module_name, resource_name, action, cancelAction, successAction } =
    actionConfig;

  const config = yield* getResourceAction(module_name, resource_name, action);

  if (!config) return;

  const ok = yield* handleActionConfirm(config);

  if (!ok) {
    if (cancelAction) {
      yield put(cancelAction);
    }

    return;
  }

  try {
    const { apiClient } = yield* getGlobalContext();
    const response = yield apiClient.request({
      method: config.apiMethod,
      url: config.apiUrl
    });

    yield* handleActionFeedback(response);

    if (successAction) {
      yield put(successAction);
    }
  } catch (error) {
    yield* handleActionError(error);
  }
}

const sagas = [takeLatest('@requestAction', requestAction)];

export default sagas;
