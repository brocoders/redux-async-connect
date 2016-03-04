import { connect } from 'react-redux';

export const LOAD = 'reduxAsyncConnect/LOAD';
export const LOAD_SUCCESS = 'reduxAsyncConnect/LOAD_SUCCESS';
export const LOAD_FAIL = 'reduxAsyncConnect/LOAD_FAIL';
export const CLEAR = 'reduxAsyncConnect/CLEAR';
export const BEGIN_GLOBAL_LOAD = 'reduxAsyncConnect/BEGIN_GLOBAL_LOAD';
export const END_GLOBAL_LOAD = 'reduxAsyncConnect/END_GLOBAL_LOAD';

export function reducer(state = {loaded: false}, action = {}) {
  switch (action.type) {
    case BEGIN_GLOBAL_LOAD:
      return {
        ...state,
        loaded: false
      };
    case END_GLOBAL_LOAD:
      return {
        ...state,
        loaded: true
      };
    case LOAD:
      return {
        ...state,
        loadState: {
          [action.key]: {
            loading: true,
            loaded: false
          }
        }
      };
    case LOAD_SUCCESS:
      return {
        ...state,
        loadState: {
          [action.key]: {
            loading: false,
            loaded: true,
            error: null
          }
        },
        [action.key]: action.data
      };
    case LOAD_FAIL:
      return {
        ...state,
        loadState: {
          [action.key]: {
            loading: false,
            loaded: false,
            error: action.error
          }
        },
        [action.key]: null
      };
    case CLEAR:
      return {
        ...state,
        loadState: {
          [action.key]: {
            loading: false,
            loaded: false,
            error: null
          }
        },
        [action.key]: null
      };
    default:
      return state;
  }
}

export function clearKey(key) {
  return {
    type: CLEAR,
    key
  };
}

export function beginGlobalLoad() {
  return { type: BEGIN_GLOBAL_LOAD };
}

export function endGlobalLoad() {
  return { type: END_GLOBAL_LOAD };
}

function load(key) {
  return {
    type: LOAD,
    key
  };
}

export function loadSuccess(key, data) {
  return {
    type: LOAD_SUCCESS,
    key,
    data
  };
}

function loadFail(key, error) {
  return {
    type: LOAD_FAIL,
    key,
    error
  };
}

function wrapWithDispatch(asyncItems) {
  return asyncItems.map(item =>
    item.key ? {...item, promise: (options) => {
      const {dispatch} = options.store;
      const promiseOrResult = item.promise(options);
      if (promiseOrResult !== undefined) {
        if (promiseOrResult.then instanceof Function) {
          dispatch(load(item.key));
          promiseOrResult.then(data => dispatch(loadSuccess(item.key, data)))
                         .catch(err => dispatch(loadFail(item.key, err)));
        } else {
          dispatch(loadSuccess(item.key, promiseOrResult));
        }

      }
      return promiseOrResult;
    }} : item
  );
}

export function asyncConnect(asyncItems) {
  return Component => {
    Component.reduxAsyncConnect = wrapWithDispatch(asyncItems);

    const finalMapStateToProps = state => {
      return asyncItems.reduce((result, item) =>
        item.key ? {...result, [item.key]: state.reduxAsyncConnect[item.key]} : result,
        {}
      );
    };

    return connect(finalMapStateToProps)(Component);
  };
}
