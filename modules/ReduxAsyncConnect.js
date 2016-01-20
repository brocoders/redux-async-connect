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
      for (const key of components[i]) {
        iterator(components[i][key], i, key);
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

function asyncConnectPromises(components, params, store, helpers) {
  return components.map(Component => Component.reduxAsyncConnect(params, store, helpers))
    .filter(result => result && result.then instanceof Function);
}

export function loadOnServer({ components, params }, store, helpers) {
  return Promise.all(asyncConnectPromises(filterAndFlattenComponents(components), params, store, helpers))
    .catch(error => console.error('reduxAsyncConnect server promise error: ' + error)).then(() => {
      store.dispatch(endLoad());
    });
}

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
      propsToShow: null
    };
  }

  componentDidMount() {
    const dataLoaded = this.context.store.getState().reduxAsyncConnect.loaded;

    if (!dataLoaded) { // we dont need it if we already made it on server-side
      this.loadAsyncData(this.props);
    }
  }

  componentWillReceiveProps(nextProps) {
    this.loadAsyncData(nextProps);
  }

  loadAsyncData(props) {
    const { components, params, helpers } = props;
    const store = this.context.store;
    const promises = asyncConnectPromises(filterAndFlattenComponents(components), params, store, helpers);

    if (promises.length) {
      this.props.beginGlobalLoad();
      Promise.all(promises).catch(error => console.error('reduxAsyncConnect server promise error: ' + error))
        .then(() => {
          this.setState({propsToShow: props});
          this.props.endGlobalLoad();
        });
    } else {
      this.setState({propsToShow: props});
    }
  }

  render() {
    const {propsToShow} = this.state;
    return propsToShow && this.props.render(propsToShow);
  }
}

export default connect(() => ({}), {beginGlobalLoad, endGlobalLoad})(ReduxAsyncConnect);
