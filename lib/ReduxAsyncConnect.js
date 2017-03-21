'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.loadOnServer = loadOnServer;

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

var _React$PropTypes = _react2.default.PropTypes,
    array = _React$PropTypes.array,
    func = _React$PropTypes.func,
    object = _React$PropTypes.object,
    any = _React$PropTypes.any;

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

function asyncConnectPromises(components, params, store, helpers) {
  return components.map(function (Component) {
    return Component.reduxAsyncConnect(params, store, helpers);
  }).filter(function (result) {
    return result && result.then instanceof Function;
  });
}

function loadOnServer(_ref, store, helpers) {
  var components = _ref.components,
      params = _ref.params;

  return Promise.all(asyncConnectPromises(filterAndFlattenComponents(components), params, store, helpers)).catch(function (error) {
    return console.error('reduxAsyncConnect server promise error: ', error);
  }).then(function () {
    store.dispatch((0, _asyncConnect.endGlobalLoad)());
  });
}

var loadDataCounter = 0;

var ReduxAsyncConnect = function (_React$Component) {
  _inherits(ReduxAsyncConnect, _React$Component);

  _createClass(ReduxAsyncConnect, [{
    key: 'isLoaded',
    value: function isLoaded() {
      return this.context.store.getState().reduxAsyncConnect.loaded;
    }
  }]);

  function ReduxAsyncConnect(props, context) {
    _classCallCheck(this, ReduxAsyncConnect);

    var _this = _possibleConstructorReturn(this, (ReduxAsyncConnect.__proto__ || Object.getPrototypeOf(ReduxAsyncConnect)).call(this, props, context));

    _this.state = {
      propsToShow: _this.isLoaded() ? props : null
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

      var components = props.components,
          params = props.params,
          helpers = props.helpers;

      var store = this.context.store;
      var promises = asyncConnectPromises(filterAndFlattenComponents(components), params, store, helpers);

      loadDataCounter++;

      if (promises.length) {
        this.props.beginGlobalLoad();
        (function (loadDataCounterOriginal) {
          Promise.all(promises).catch(function (error) {
            return console.error('reduxAsyncConnect server promise error: ', error);
          }).then(function () {
            // We need to change propsToShow only if loadAsyncData that called this promise
            // is the last invocation of loadAsyncData method. Otherwise we can face situation
            // when user is changing route several times and we finally show him route that has
            // loaded props last time and not the last called route
            if (loadDataCounter === loadDataCounterOriginal) {
              _this2.setState({ propsToShow: props });
            }
            _this2.props.endGlobalLoad();
          });
        })(loadDataCounter);
      } else {
        this.setState({ propsToShow: props });
      }
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
  helpers: any
};
ReduxAsyncConnect.contextTypes = {
  store: object.isRequired
};
ReduxAsyncConnect.defaultProps = {
  render: function render(props) {
    return _react2.default.createElement(_RouterContext2.default, props);
  }
};
exports.default = (0, _reactRedux.connect)(null, { beginGlobalLoad: _asyncConnect.beginGlobalLoad, endGlobalLoad: _asyncConnect.endGlobalLoad })(ReduxAsyncConnect);