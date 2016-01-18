import React from 'react';
import RouterContext from 'react-router/lib/RouterContext';
import { toggleLoading, initialDataLoaded } from './asyncConnect';
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
  return Promise.all(asyncConnectPromises(filterAndFlattenComponents(components), params, store, helpers)).then(() => {
    store.dispatch(initialDataLoaded());
  });
}


class ReduxAsyncConnect extends React.Component {
  static propTypes = {
    components: array.isRequired,
    params: object.isRequired,
    render: func.isRequired,
    toggleLoading: func.isRequired,
    initialDataLoaded: func.isRequired,
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
      prevProps: null
    };
  }

  componentDidMount() {
    const { components, params } = this.props;
    const dataLoaded = this.context.store.getState().reduxAsyncConnect.loaded;

    if (!dataLoaded) { // we dont need it if we already made it on server-side
      this.loadAsyncData(components, params).then(this.props.initialDataLoaded);
    }
  }

  componentWillReceiveProps(nextProps) {
    const { components, params } = nextProps;
    this.loadAsyncData(components, params);
  }

  loadAsyncData(components, params) {
    const helpers = this.props.helpers;
    const store = this.context.store;

    const promises = asyncConnectPromises(filterAndFlattenComponents(components), params, store, helpers);

    if (promises.length !== 0) {
      this.setState({ prevProps: this.props, loading: true });
      this.props.toggleLoading(true);

      return Promise.all(promises).then(() => {}).then(() => {
        this.setState({ prevProps: null, loading: false });
        this.props.toggleLoading(false);
      });
    }

    return Promise.resolve();
  }

  render() {
    const props = this.state.loading ? this.state.prevProps : this.props;
    return this.props.render(props);
  }

}

export default connect(() => ({}), {toggleLoading, initialDataLoaded})(ReduxAsyncConnect);
