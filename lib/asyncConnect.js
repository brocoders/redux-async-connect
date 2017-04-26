'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.END_GLOBAL_LOAD = exports.BEGIN_GLOBAL_LOAD = exports.CLEAR = exports.LOAD_FAIL = exports.LOAD_SUCCESS = exports.LOAD = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.reducer = reducer;
exports.clearKey = clearKey;
exports.beginGlobalLoad = beginGlobalLoad;
exports.endGlobalLoad = endGlobalLoad;
exports.loadSuccess = loadSuccess;
exports.asyncConnect = asyncConnect;

var _reactRedux = require('react-redux');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var LOAD = exports.LOAD = 'reduxAsyncConnect/LOAD';
var LOAD_SUCCESS = exports.LOAD_SUCCESS = 'reduxAsyncConnect/LOAD_SUCCESS';
var LOAD_FAIL = exports.LOAD_FAIL = 'reduxAsyncConnect/LOAD_FAIL';
var CLEAR = exports.CLEAR = 'reduxAsyncConnect/CLEAR';
var BEGIN_GLOBAL_LOAD = exports.BEGIN_GLOBAL_LOAD = 'reduxAsyncConnect/BEGIN_GLOBAL_LOAD';
var END_GLOBAL_LOAD = exports.END_GLOBAL_LOAD = 'reduxAsyncConnect/END_GLOBAL_LOAD';

function reducer() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { loaded: false };
  var action = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var stateSlice = state[action.key];

  switch (action.type) {
    case BEGIN_GLOBAL_LOAD:
      return _extends({}, state, {
        loaded: false
      });
    case END_GLOBAL_LOAD:
      return _extends({}, state, {

        loaded: true
      });
    case LOAD:
      return _extends({}, state, _defineProperty({}, action.key, _extends({}, stateSlice, {
        loading: true,
        loaded: false
      })));
    case LOAD_SUCCESS:
      return _extends({}, state, _defineProperty({}, action.key, _extends({}, stateSlice, {
        loading: false,
        loaded: true,
        data: action.data
      })));
    case LOAD_FAIL:
      return _extends({}, state, _defineProperty({}, action.key, _extends({}, stateSlice, {
        loading: false,
        loaded: false,
        error: action.error
      })));
    case CLEAR:
      return _extends({}, state, _defineProperty({}, action.key, {
        loaded: false,
        loading: false
      }));
    default:
      return state;
  }
}

function clearKey(key) {
  return {
    type: CLEAR,
    key: key
  };
}

function beginGlobalLoad() {
  return { type: BEGIN_GLOBAL_LOAD };
}

function endGlobalLoad() {
  return { type: END_GLOBAL_LOAD };
}

function load(key) {
  return {
    type: LOAD,
    key: key
  };
}

function loadSuccess(key, data) {
  return {
    type: LOAD_SUCCESS,
    key: key,
    data: data
  };
}

function loadFail(key, error) {
  return {
    type: LOAD_FAIL,
    key: key,
    error: error
  };
}

function componentLoadCb(mapStateToProps, params, store, helpers) {
  var dispatch = store.dispatch;

  var promises = Object.keys(mapStateToProps).reduce(function (result, key) {
    var promiseOrResult = mapStateToProps[key](params, _extends({}, helpers, { store: store }));

    if (promiseOrResult !== undefined) {
      if (promiseOrResult.then instanceof Function) {
        dispatch(load(key));
        promiseOrResult = promiseOrResult.then(function (nextData) {
          return dispatch(loadSuccess(key, nextData));
        }, function (err) {
          return dispatch(loadFail(key, err));
        });

        return [].concat(_toConsumableArray(result), [promiseOrResult]);
      }

      dispatch(loadSuccess(key, promiseOrResult));
    }
    return [].concat(_toConsumableArray(result));
  }, []);

  return promises.length === 0 ? null : Promise.all(promises);
}

function asyncConnect(mapStateToProps) {
  return function (Component) {
    Component.reduxAsyncConnect = function (params, store, helpers) {
      return componentLoadCb(mapStateToProps, params, store, helpers);
    };

    var finalMapStateToProps = function finalMapStateToProps(state) {
      return Object.keys(mapStateToProps).reduce(function (result, key) {
        return _extends({}, result, _defineProperty({}, key, state.reduxAsyncConnect[key]));
      }, {});
    };

    return (0, _reactRedux.connect)(finalMapStateToProps)(Component);
  };
}