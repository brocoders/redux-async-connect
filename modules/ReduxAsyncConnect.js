import PropTypes from 'prop-types';
import React from 'react';
import RouterContext from 'react-router/lib/RouterContext';
import { beginGlobalLoad, endGlobalLoad, fullEndGlobalLoad } from './asyncConnect';
import { connect, ReactReduxContext } from 'react-redux';

const { array, func, object, any, bool } = PropTypes;

/**
 * We need to iterate over all components for specified routes.
 * Components array can include objects if named components are used:
 * https://github.com/rackt/react-router/blob/latest/docs/API.md#named-components
 *
 * @param components
 * @param iterator
 */
function eachComponents(components, iterator) {
  for (let i = 0, l = components.length; i < l; i++) { // eslint-disable-line id-length
    if (typeof components[i] === 'object') {
      for (let [key, value] of Object.entries(components[i])) {
        iterator(value, i, key);
      }
    } else {
      iterator(components[i], i);
    }
  }
}

function filterAndFlattenComponents(components) {
  const flattened = [];
  eachComponents(components, (Component) => {
    if (Component && Component.reduxAsyncConnect) {
      flattened.push(Component);
    }
  });
  return flattened;
}

function loadAsyncConnect({components, filter = () => true, skip = () => false, ...rest}) {
  let async = false;
  let incomplete = false;

  const filteredKeys = [];
  const filteredPromises = [];
  const allPromises = [];

  filterAndFlattenComponents(components).forEach(Component => {
    Component.reduxAsyncConnect.forEach(item => {
      if (skip(item)) {
        incomplete = true;
        return;
      }

      let promiseOrResult = item.promise(rest);
      if (promiseOrResult && promiseOrResult.then instanceof Function) {
        promiseOrResult = promiseOrResult.catch(error => ({error}));
        allPromises.push(promiseOrResult);
        if (filter(item, Component)) {
          async = true;
          filteredKeys.push(item.key);
          filteredPromises.push(promiseOrResult);
        }
      }
    });
  });

  const allPromise = Promise.all(allPromises);
  const promise = Promise.all(filteredPromises).then(results => {
    return filteredKeys.reduce((result, key, i) => {
      if (key) {
        result[key] = results[i];
      }
      return result;
    }, {});
  });

  return {allPromise, promise, async, incomplete};
}

export function loadOnServer(args) {
  const result = loadAsyncConnect(args);
  if (result.async && !result.incomplete) {
    return result.promise.then(data => {
      args.store.dispatch(endGlobalLoad());
      args.store.dispatch(fullEndGlobalLoad());
      return data;
    });
  }
  return result.promise;
}

let loadDataCounter = 0;

class ReduxAsyncConnect extends React.Component {
  static propTypes = {
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

  static defaultProps = {
    render(props) {
      return <RouterContext {...props} />;
    }
  };

  isLoaded() {
    return this.props.store.getState().reduxAsyncConnect.loaded;
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      propsToShow: props.renderIfNotLoaded || this.isLoaded() ? props : null
    };
  }

  componentDidMount() {
    const dataLoaded = this.isLoaded();

    if (!dataLoaded) { // we dont need it if we already made it on server-side
      this.loadAsyncData(this.props);
    }
  }

  componentWillReceiveProps(nextProps) {
    this.loadAsyncData(nextProps);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.state.propsToShow !== nextState.propsToShow;
  }

  loadAsyncData(props) {
    const store = this.props.store;
    const loadResult = loadAsyncConnect({...props, store});

    loadDataCounter++;

    if (loadResult && loadResult.then instanceof Function) {
      this.props.beginGlobalLoad();
      return (loadDataCounterOriginal => {
        loadResult.promise.then(() => {
          // We need to change propsToShow only if loadAsyncData that called this promise
          // is the last invocation of loadAsyncData method. Otherwise we can face situation
          // when user is changing route several times and we finally show him route that has
          // loaded props last time and not the last called route
          if (loadDataCounter === loadDataCounterOriginal) {
            this.setState({propsToShow: props});
          }
          this.props.endGlobalLoad();
        });
        return loadResult.allPromise.then(() => {
          this.props.fullEndGlobalLoad();
        })
      })(loadDataCounter);
    } else {
      this.setState({propsToShow: props});
    }
    return Promise.resolve(null);
  }

  render() {
    const {propsToShow} = this.state;
    return propsToShow && this.props.render(propsToShow);
  }
}


const ReactReduxConnectWrapper = React.forwardRef(function ReactReduxConnectWrapper(props, ref) {
  return (
      <ReactReduxContext.Consumer>
        {({store}) => <ReduxAsyncConnect {...props} store={store} ref={ref} />}
      </ReactReduxContext.Consumer>
  );
});

export default connect(null, {
  beginGlobalLoad,
  endGlobalLoad,
  fullEndGlobalLoad,
}, null, {
  forwardRef: true,
})(ReactReduxConnectWrapper);
