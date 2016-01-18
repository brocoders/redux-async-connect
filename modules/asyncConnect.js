import { connect } from 'react-redux';

const LOAD = 'reduxAsyncConnect/LOAD';
const LOAD_SUCCESS = 'reduxAsyncConnect/LOAD_SUCCESS';
const LOAD_FAIL = 'reduxAsyncConnect/LOAD_FAIL';
const CLEAR = 'reduxAsyncConnect/CLEAR';
const GLOBAL_LOADING = 'reduxAsyncConnect/GLOBAL_LOADING';
const INITIAL_DATA_LOADED = 'reduxAsyncConnect/INITIAL_DATA_LOADED';

export function reducer(state = {loading: false, loaded: false}, action = {}) {
  const stateSlice = state[action.key];

  switch (action.type) {
    case INITIAL_DATA_LOADED:
      return {
        ...state,
        loaded: true
      };
    case GLOBAL_LOADING:
      return {
        ...state,
        loading: action.state
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

export function toggleLoading(newState) {
  return {
    type: GLOBAL_LOADING,
    state: newState
  };
}

export function initialDataLoaded() {
  return { type: INITIAL_DATA_LOADED };
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
