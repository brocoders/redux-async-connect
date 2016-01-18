# ReduxAsyncConnect for React Router
[![npm version](https://img.shields.io/npm/v/redux-async-connect.svg?style=flat-square)](https://www.npmjs.com/package/redux-async-connect)
How do you usually request data and store it to redux state?
You create actions that do async jobs to load data, create reducer to save this data to redux state, 
then connect data to your component or container.

Usually it's very similar routine tasks.

Also, usually we want data to be preloaded. Especially if you're building universal app, 
or you just want pages to be solid, don't jump when data was loaded.

This package consist of 2 parts: one part allows you to delay containers rendering until some async actions are happening.
Another stores your data to redux state and connect your loaded data to your container.

So, you can do something like: 

```js
@asyncConnect({
  lunches: (params, helpers) => helpers.client.get('/lunches')
})
export default class Home extends Component {
```
 