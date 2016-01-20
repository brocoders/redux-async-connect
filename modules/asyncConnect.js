import { connect } from 'react-redux';

export const LOAD = 'reduxAsyncConnect/LOAD';
export const LOAD_SUCCESS = 'reduxAsyncConnect/LOAD_SUCCESS';
export const LOAD_FAIL = 'reduxAsyncConnect/LOAD_FAIL';
export const CLEAR = 'reduxAsyncConnect/CLEAR';
export const BEGIN_GLOBAL_LOAD = 'reduxAsyncConnect/BEGIN_GLOBAL_LOAD';
export const END_GLOBAL_LOAD = 'reduxAsyncConnect/END_GLOBAL_LOAD';

export function reducer(state = {loaded: false}, action = {}) {
  const stateSlice = state[action.key];

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
        [action.key]: {
          ...stateSlice,
          loading: true,
          loaded: false
        }
      };
    case LOAD_SUCCESS:
      return {
        ...state,
        [action.key]: {
          ...stateSlice,
          loading: false,
          loaded: true,
          data: action.data
        }
      };
    case LOAD_FAIL:
      return {
        ...state,
        [action.key]: {
          ...stateSlice,
          loading: false,
          loaded: false,
          error: action.error
        }
      };
    case CLEAR:
      return {
        ...state,
        [action.key]: {
          loaded: false,
          loading: false
        }
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

function componentLoadCb(mapStateToProps, params, store, helpers) {
  const dispatch = store.dispatch;

  const promises = Object.keys(mapStateToProps).reduce((result, key) => {
    let promiseOrResult = mapStateToProps[key](params, {...helpers, store});

    if (promiseOrResult !== undefined) {
      if (promiseOrResult.then instanceof Function) {
        dispatch(load(key));
        promiseOrResult = promiseOrResult
          .then(nextData => dispatch(loadSuccess(key, nextData)),
            err => dispatch(loadFail(key, err)));

        return [...result, promiseOrResult];
      }

      dispatch(loadSuccess(key, promiseOrResult));
    }
    return [...result];
  }, []);

  return promises.length === 0 ? null : Promise.all(promises);
}

export function asyncConnect(mapStateToProps) {
  return Component => {
    Component.reduxAsyncConnect = (params, store, helpers) => componentLoadCb(mapStateToProps, params, store, helpers);

    const finalMapStateToProps = state => {
      return Object.keys(mapStateToProps).reduce((result, key) => ({...result, [key]: state.reduxAsyncConnect[key]}), {});
    };

    return connect(finalMapStateToProps)(Component);
  };
}
