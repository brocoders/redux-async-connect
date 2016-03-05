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

function loadAsyncConnect({components, filter = () => true, ...rest}) {
  let async = false;
  const promise = Promise.all(filterAndFlattenComponents(components).map(Component => {
    const asyncItems = Component.reduxAsyncConnect;

    return Promise.all(asyncItems.reduce((itemsResults, item) => {
      let promiseOrResult = item.promise(rest);

      if (filter(item, Component)) {
        if (promiseOrResult && promiseOrResult.then instanceof Function) {
          async = true;
          promiseOrResult = promiseOrResult.catch(error => ({error}));
        }
        return [...itemsResults, promiseOrResult];
      } else {
        return itemsResults;
      }
    }, [])).then(results => {
      return asyncItems.reduce((result, item, i) => ({...result, [item.key]: results[i]}), {});
    });
  }));

  return {promise, async};
}

export function loadOnServer(args) {
  const result = loadAsyncConnect(args);
  if (result.async) {
    result.promise.then(() => {
      args.store.dispatch(endGlobalLoad());
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

  isLoaded() {
    return this.context.store.getState().reduxAsyncConnect.loaded;
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      propsToShow: this.isLoaded() ? props : null
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
    const store = this.context.store;
    const loadResult = loadAsyncConnect({...props, store});

    loadDataCounter++;

    if (loadResult.async) {
      this.props.beginGlobalLoad();
      (loadDataCounterOriginal => {
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
    const {propsToShow} = this.state;
    return propsToShow && this.props.render(propsToShow);
  }
}

export default connect(null, {beginGlobalLoad, endGlobalLoad})(ReduxAsyncConnect);
