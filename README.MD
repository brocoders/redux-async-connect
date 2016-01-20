ReduxAsyncConnect for React Router
============
[![npm version](https://img.shields.io/npm/v/redux-async-connect.svg?style=flat-square)](https://www.npmjs.com/package/redux-async-connect)

How do you usually request data and store it to redux state?
You create actions that do async jobs to load data, create reducer to save this data to redux state, 
then connect data to your component or container.

Usually it's very similar routine tasks.

Also, usually we want data to be preloaded. Especially if you're building universal app, 
or you just want pages to be solid, don't jump when data was loaded.

This package consist of 2 parts: one part allows you to delay containers rendering until some async actions are happening.
Another stores your data to redux state and connect your loaded data to your container.

## Installation & Usage

Using [npm](https://www.npmjs.com/):

    $ npm install redux-async-connect

```js
import { Router, browserHistory } from 'react-router';
import { ReduxAsyncConnect, asyncConnect, reducer as reduxAsyncConnect } from 'redux-async-connect'
import React from 'react'
import { render } from 'react-dom'
import { createStore, combineReducers } from 'redux';

// 1. Connect your data, similar to react-redux @connect
@asyncConnect({
  lunch: (params, helpers) => Promise.resolve({id: 1, name: 'Borsch'})
})
class App extends React.Component {
  render() {
    // 2. access data as props
    const lunch = this.props.lunch
    return (
      <div>{lunch.name}</div>
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

## [API](/docs/API.MD)

## Comparing with other libraries

There are some solutions of problem described above:

- [**AsyncProps**](https://github.com/rackt/async-props)
  It solves the same problem, but it doesn't work with redux state. Also it's significantly more complex inside, 
  because it contains lots of logic to connect data to props.
  It uses callbacks against promises... 
- [**react-fetcher**](https://github.com/markdalgleish/react-fetcher)
  It's very simple library too. But it provides you only interface for decorating your components and methods 
  to fetch data for them. It doesn't integrated with React Router or Redux. So, you need to write you custom logic
  to delay routing transition for example.
- [**react-resolver**](https://github.com/ericclemmons/react-resolver)
  Works similar, but isn't integrated with redux. 

**Redux Async Connect** uses awesome [Redux](https://github.com/rackt/redux) to keep all fetched data in state.
This integration gives you agility: 

- you can react on fetching actions like data loading or load success in your own reducers
- you can create own middleware to handle Redux Async Connect actions
- you can connect to loaded data anywhere else, just using simple redux @connect
- finally, you can debug and see your data using Redux Dev Tools

Also it's integrated with [React Router](https://github.com/rackt/react-router) to prevent routing transition 
until data is loaded.

## Contributors
- [Rodion Salnik](https://github.com/sars)
- [Rezonans team](https://github.com/Rezonans)

## Collaboration
You're welcome to PR, and we appreciate any questions or issues, please [open an issue](https://github.com/Rezonans/redux-async-connect/issues)!
