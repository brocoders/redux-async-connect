ReduxAsyncConnect for React Router
============
[![npm version](https://img.shields.io/npm/v/redux-async-connect.svg?style=flat-square)](https://www.npmjs.com/package/redux-async-connect)

How do you usually request data and store it in redux state?
You create actions that do async jobs to load data into reducers and thus to the redux state, 
then connect the data as props to your component or container.

We usually also want data to be preloaded, especially if you're building a universal app or don't want the page to flash with content when the data is finally loaded.

ReduxAsyncConnect makes blocking data fetchting at the component level trivial by combining 2 things:

- one component that allows you to delay containers rendering until async actions are done
- a decorator or static function on a component that returns that promise for its data fetching

## Installation & Usage

Using [npm](https://www.npmjs.com/):

    $ npm install redux-async-connect

```js
import { Router, browserHistory } from 'react-router';
import { ReduxAsyncConnect, asyncConnect, reducer as reduxAsyncConnect } from 'redux-async-connect'
import React from 'react'
import { render } from 'react-dom'
import { createStore, combineReducers } from 'redux';
import { loadWidgets } from './myModule';

// 1. Connect your data, similar to react-redux @connect
// Decorator version
@asyncConnect({
  lunch: (params, store, helpers) => Promise.resolve({id: 1, name: 'Borsch'})
})
class App extends React.Component {  
  render() {
    // 2. access data as props
    const lunch = this.props.lunch;
    return (
      <div>{lunch.name}</div>
    )
  }
}

class AppHeader extends React.Component {
  // 1. Same as the decorator but as a function
  static reduxAsyncConnect(params, store, helpers) {
    const { dispatch } = store;
    // loadWidgets here could be an action that does a HTTP call to our server 
    return Promise.all([dispatch(loadWidgets())]);
  }

  render() {
    // 2. access data as props
    const widget = this.props.widget;
    return (
      <div>{widget}</div>
    )
  }
}

// 3. Connect redux async reducer
const store = createStore(combineReducers({reduxAsyncConnect}), window.__data);

// 4. Render `Router` with ReduxAsyncConnect middleware
render((
  <Provider store={store} key="provider">
    <Router render={(props) => <ReduxAsyncConnect {...props}/>} history={browserHistory}>
      <Route path="/" component={App}/>
    </Router>
  </Provider>
), el)
```

### Server

```js
import { renderToString } from 'react-dom/server'
import { match, RoutingContext } from 'react-router'
import { ReduxAsyncConnect, loadOnServer, reducer as reduxAsyncConnect } from 'redux-async-connect'
import createHistory from 'history/lib/createMemoryHistory';
import {Provider} from 'react-redux';
import { createStore, combineReducers } from 'redux';

app.get('*', (req, res) => {
  const history = createHistory();
  const store = createStore(combineReducers({reduxAsyncConnect}));

  match({ routes, location: req.url }, (err, redirect, renderProps) => {

    // 1. load data
    loadOnServer(renderProps, store).then(() => {

      // 2. use `ReduxAsyncConnect` instead of `RoutingContext` and pass it `renderProps`
      const appHTML = renderToString(
        <Provider store={store} key="provider">
          <ReduxAsyncConnect {...renderProps} />
        </Provider>
      )

      // 3. render the Redux initial data into the server markup
      const html = createPage(appHTML, store)
      res.send(html)
    })
  })
})

function createPage(html, store) {
  return `
    <!doctype html>
    <html>
      <body>
        <div id="app">${html}</div>

        <!-- its a Redux initial data -->
        <script dangerouslySetInnerHTML={{__html: `window.__data=${serialize(store.getState())};`}} charSet="UTF-8"/>
      </body>
    </html>
  `
}
```

## API
You can find more detailed documentation on the [API page](/docs/API.MD).

## Comparison with other libraries

A few existing libraries try to solve the same issue:

- [**AsyncProps**](https://github.com/rackt/async-props)
  It solves the same problem, but it doesn't work with redux state. Also it's significantly more complex inside, 
  because it contains lots of logic to connect data to props.
  It also uses callbacks and not promises
- [**react-fetcher**](https://github.com/markdalgleish/react-fetcher)
  It's very simple library too but it provides you only with the interface for decorating your components and methods 
  to fetch data for them. It doesn't integrate with React Router or Redux which means you need to write custom logic
  to delay routing transition for example.
- [**react-resolver**](https://github.com/ericclemmons/react-resolver)
  Works similarly but isn't integrated with redux. 

**Redux Async Connect** uses awesome [Redux](https://github.com/rackt/redux) to keep all fetched data in state.
This integration gives you a few things: 

- you can react on fetching actions like data loading or load success in your own reducers
- you can create your own middleware to handle Redux Async Connect actions
- you can connect to loaded data anywhere by using simple redux @connect
- it is integrated with [React Router](https://github.com/rackt/react-router) to prevent routing transition 
until data is loaded.
- finally, you can debug and see your data using Redux Dev Tools


## Contributors
- [Rodion Salnik](https://github.com/sars)
- [Rezonans team](https://github.com/Rezonans)

## Collaboration
You're welcome to submit a PR, and we appreciate any questions or issues, please [open an issue](https://github.com/Rezonans/redux-async-connect/issues)!
