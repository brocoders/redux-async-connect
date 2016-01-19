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

So, you can do something like: 

```js
@asyncConnect({
  lunches: (params, helpers) => helpers.client.get('/lunches')
})
export default class Home extends Component {
  static propTypes = {
    lunches: PropTypes.object
  };
  
  render() {
    const lunches = this.props.lunches;
    return (
      <div className={styles.home}>
        {lunches.loaded && <Lunches lunches={lunches} />}
      </div>
    );
  }
}
```

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
  Works similar, but doesn't integrated with redux. 

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
You're welcome to PR, and we appreciate any questions or issues, please [open an issue][issue]!
