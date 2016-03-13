import React from 'react';
import RouterContext from 'react-router/lib/RouterContext';
import { beginGlobalLoad, endGlobalLoad } from './asyncConnect';
import { connect } from 'react-redux';

const { array, func, object, any } = React.PropTypes;

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
      for (const [key, value] of Object.entries(components[i])) {
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

function loadAsyncConnect({components, fetchDeferred, ...rest}) {
  let hasAsync = false;
  let loadDeferred = false;
  const promise = Promise.all(filterAndFlattenComponents(components).map(Component => {
    const asyncItems = Component.reduxAsyncConnect;

    return Promise.all(asyncItems.reduce((itemsResults, item) => {
      let promiseOrResult = item.promise(rest);

      if (!loadDeferred && !fetchDeferred) {
        loadDeferred = item.deferred;
      }

      const loadItem = fetchDeferred ? item.deferred : item;

      if (loadItem) {
        if (promiseOrResult && promiseOrResult.then instanceof Function) {
          hasAsync = true;
          promiseOrResult = promiseOrResult.catch(error => ({error}));
        }
        return [...itemsResults, promiseOrResult];
      }

      return itemsResults;
    }, [])).then(results => {
      return asyncItems.reduce((result, item, index) =>
                               ({...result, [item.key]: results[index]}), {});
    });
  }));

  return {
    promise,
    hasAsync,
    loadDeferred,
  };
}

export function loadOnServer(args) {
  const result = loadAsyncConnect(args);
  if (result.hasAsync) {
    result.promise.then(() => {
      args.store.dispatch(endGlobalLoad(result.loadDeferred));
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
    helpers: any
  };

  static contextTypes = {
    store: object.isRequired
  };

  static defaultProps = {
    render(props) {
      return <RouterContext {...props} />;
    }
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      propsToShow: this.isLoaded() ? props : null
    };
  }

  componentDidMount() {
    const dataLoaded = this.isLoaded();
    const fetchDeferred = !this.isDeferredLoaded();

    if (!dataLoaded || fetchDeferred) { // we dont need it if we already made it on server-side
      this.loadAsyncData(this.props, fetchDeferred);
    }
  }

  componentWillReceiveProps(nextProps) {
    const deferredLoaded = this.isDeferredLoaded();

    if (deferredLoaded) {
      this.loadAsyncData(nextProps);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.state.propsToShow !== nextState.propsToShow;
  }

  isLoaded() {
    return this.context.store.getState().reduxAsyncConnect.loaded;
  }

  isDeferredLoaded() {
    return this.context.store.getState().reduxAsyncConnect.deferredLoaded;
  }

  loadAsyncData(props, fetchDeferred) {
    const store = this.context.store;
    const loadResult = loadAsyncConnect({...props, store, fetchDeferred});

    loadDataCounter++;

    if (loadResult.hasAsync) {
      this.props.beginGlobalLoad();
      ((loadDataCounterOriginal) => {
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
      })(loadDataCounter);
    } else {
      this.setState({propsToShow: props});
    }
  }

  render() {
    const { propsToShow } = this.state;
    return propsToShow && this.props.render(propsToShow);
  }
}

export default connect(null, {beginGlobalLoad, endGlobalLoad})(ReduxAsyncConnect);
