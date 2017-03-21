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
      return _extends({}, state, {
        loadState: _defineProperty({}, action.key, {
          loading: true,
          loaded: false
        })
      });
    case LOAD_SUCCESS:
      return _extends({}, state, _defineProperty({
        loadState: _defineProperty({}, action.key, {
          loading: false,
          loaded: true,
          error: null
        })
      }, action.key, action.data));
    case LOAD_FAIL:
      return _extends({}, state, _defineProperty({
        loadState: _defineProperty({}, action.key, {
          loading: false,
          loaded: false,
          error: action.error
        })
      }, action.key, null));
    case CLEAR:
      return _extends({}, state, _defineProperty({
        loadState: _defineProperty({}, action.key, {
          loading: false,
          loaded: false,
          error: null
        })
      }, action.key, null));
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

function wrapWithDispatch(asyncItems) {
  return asyncItems.map(function (item) {
    return item.key ? _extends({}, item, { promise: function promise(options) {
        var dispatch = options.store.dispatch;

        var promiseOrResult = item.promise(options);
        if (promiseOrResult !== undefined) {
          if (promiseOrResult.then instanceof Function) {
            dispatch(load(item.key));
            promiseOrResult.then(function (data) {
              return dispatch(loadSuccess(item.key, data));
            }).catch(function (err) {
              return dispatch(loadFail(item.key, err));
            });
          } else {
            dispatch(loadSuccess(item.key, promiseOrResult));
          }
        }
        return promiseOrResult;
      } }) : item;
  });
}

function asyncConnect(asyncItems) {
  return function (Component) {
    Component.reduxAsyncConnect = wrapWithDispatch(asyncItems);

    var finalMapStateToProps = function finalMapStateToProps(state) {
      return asyncItems.reduce(function (result, item) {
        return item.key ? _extends({}, result, _defineProperty({}, item.key, state.reduxAsyncConnect[item.key])) : result;
      }, {});
    };

    return (0, _reactRedux.connect)(finalMapStateToProps)(Component);
  };
}