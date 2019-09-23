'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.loadOnServer = loadOnServer;

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _RouterContext = require('react-router/lib/RouterContext');

var _RouterContext2 = _interopRequireDefault(_RouterContext);

var _asyncConnect = require('./asyncConnect');

var _reactRedux = require('react-redux');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var array = _propTypes2.default.array,
    func = _propTypes2.default.func,
    object = _propTypes2.default.object,
    any = _propTypes2.default.any,
    bool = _propTypes2.default.bool;

/**
 * We need to iterate over all components for specified routes.
 * Components array can include objects if named components are used:
 * https://github.com/rackt/react-router/blob/latest/docs/API.md#named-components
 *
 * @param components
 * @param iterator
 */

function eachComponents(components, iterator) {
  for (var i = 0, l = components.length; i < l; i++) {
    // eslint-disable-line id-length
    if (_typeof(components[i]) === 'object') {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.entries(components[i])[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _step$value = _slicedToArray(_step.value, 2),
              key = _step$value[0],
              value = _step$value[1];

          iterator(value, i, key);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    } else {
      iterator(components[i], i);
    }
  }
}

function filterAndFlattenComponents(components) {
  var flattened = [];
  eachComponents(components, function (Component) {
    if (Component && Component.reduxAsyncConnect) {
      flattened.push(Component);
    }
  });
  return flattened;
}

function loadAsyncConnect(_ref) {
  var components = _ref.components,
      _ref$filter = _ref.filter,
      filter = _ref$filter === undefined ? function () {
    return true;
  } : _ref$filter,
      _ref$skip = _ref.skip,
      skip = _ref$skip === undefined ? function () {
    return false;
  } : _ref$skip,
      rest = _objectWithoutProperties(_ref, ['components', 'filter', 'skip']);

  var async = false;
  var incomplete = false;

  var filteredKeys = [];
  var filteredPromises = [];
  var allPromises = [];

  filterAndFlattenComponents(components).forEach(function (Component) {
    Component.reduxAsyncConnect.forEach(function (item) {
      if (skip(item)) {
        incomplete = true;
        return;
      }

      var promiseOrResult = item.promise(rest);
      if (promiseOrResult && promiseOrResult.then instanceof Function) {
        promiseOrResult = promiseOrResult.catch(function (error) {
          return { error: error };
        });
        allPromises.push(promiseOrResult);
        if (filter(item, Component)) {
          async = true;
          filteredKeys.push(item.key);
          filteredPromises.push(promiseOrResult);
        }
      }
    });
  });

  var allPromise = Promise.all(allPromises);
  var promise = Promise.all(filteredPromises).then(function (results) {
    return filteredKeys.reduce(function (result, key, i) {
      if (key) {
        result[key] = results[i];
      }
      return result;
    }, {});
  });

  return { allPromise: allPromise, promise: promise, async: async, incomplete: incomplete };
}

function loadOnServer(args) {
  var result = loadAsyncConnect(args);
  if (result.async && !result.incomplete) {
    return result.promise.then(function (data) {
      args.store.dispatch((0, _asyncConnect.endGlobalLoad)());
      args.store.dispatch((0, _asyncConnect.fullEndGlobalLoad)());
      return data;
    });
  }
  return result.promise;
}

var loadDataCounter = 0;

var ReduxAsyncConnect = function (_React$Component) {
  _inherits(ReduxAsyncConnect, _React$Component);

  _createClass(ReduxAsyncConnect, [{
    key: 'isLoaded',
    value: function isLoaded() {
      return this.props.store.getState().reduxAsyncConnect.loaded;
    }
  }]);

  function ReduxAsyncConnect(props, context) {
    _classCallCheck(this, ReduxAsyncConnect);

    var _this = _possibleConstructorReturn(this, (ReduxAsyncConnect.__proto__ || Object.getPrototypeOf(ReduxAsyncConnect)).call(this, props, context));

    _this.state = {
      propsToShow: props.renderIfNotLoaded || _this.isLoaded() ? props : null
    };
    return _this;
  }

  _createClass(ReduxAsyncConnect, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var dataLoaded = this.isLoaded();

      if (!dataLoaded) {
        // we dont need it if we already made it on server-side
        this.loadAsyncData(this.props);
      }
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      this.loadAsyncData(nextProps);
    }
  }, {
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate(nextProps, nextState) {
      return this.state.propsToShow !== nextState.propsToShow;
    }
  }, {
    key: 'loadAsyncData',
    value: function loadAsyncData(props) {
      var _this2 = this;

      var store = this.props.store;
      var loadResult = loadAsyncConnect(_extends({}, props, { store: store }));

      loadDataCounter++;

      if (loadResult && loadResult.then instanceof Function) {
        this.props.beginGlobalLoad();
        return function (loadDataCounterOriginal) {
          loadResult.promise.then(function () {
            // We need to change propsToShow only if loadAsyncData that called this promise
            // is the last invocation of loadAsyncData method. Otherwise we can face situation
            // when user is changing route several times and we finally show him route that has
            // loaded props last time and not the last called route
            if (loadDataCounter === loadDataCounterOriginal) {
              _this2.setState({ propsToShow: props });
            }
            _this2.props.endGlobalLoad();
          });
          return loadResult.allPromise.then(function () {
            _this2.props.fullEndGlobalLoad();
          });
        }(loadDataCounter);
      } else {
        this.setState({ propsToShow: props });
      }
      return Promise.resolve(null);
    }
  }, {
    key: 'render',
    value: function render() {
      var propsToShow = this.state.propsToShow;

      return propsToShow && this.props.render(propsToShow);
    }
  }]);

  return ReduxAsyncConnect;
}(_react2.default.Component);

ReduxAsyncConnect.propTypes = {
  components: array.isRequired,
  params: object.isRequired,
  render: func.isRequired,
  beginGlobalLoad: func.isRequired,
  endGlobalLoad: func.isRequired,
  fullEndGlobalLoad: func.isRequired,
  renderIfNotLoaded: bool,
  helpers: any,
  store: object.isRequired
};
ReduxAsyncConnect.defaultProps = {
  render: function render(props) {
    return _react2.default.createElement(_RouterContext2.default, props);
  }
};


var ReactReduxConnectWrapper = _react2.default.forwardRef(function ReactReduxConnectWrapper(props, ref) {
  return _react2.default.createElement(
    _reactRedux.ReactReduxContext.Consumer,
    null,
    function (_ref2) {
      var store = _ref2.store;
      return _react2.default.createElement(ReduxAsyncConnect, _extends({}, props, { store: store, ref: ref }));
    }
  );
});

exports.default = (0, _reactRedux.connect)(null, {
  beginGlobalLoad: _asyncConnect.beginGlobalLoad,
  endGlobalLoad: _asyncConnect.endGlobalLoad,
  fullEndGlobalLoad: _asyncConnect.fullEndGlobalLoad
}, null, {
  forwardRef: true
})(ReactReduxConnectWrapper);