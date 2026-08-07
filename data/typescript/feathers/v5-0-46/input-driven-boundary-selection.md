# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`
Category: input driven boundary selection

## input driven boundary selection

### Secure Routing and Parameter Mapping for Deep Links and Nested Resources

**Use when**

Building nested routes, deep links, or OAuth redirect flows in Feathers applications where route parameters and authentication tokens cross security boundaries.

**Secure rules**

**Rule 1: Explicitly map nested route parameters into service queries using hooks to prevent cross-tenant exposure.**

When handling nested service routes or deep links such as `/users/:userId/posts`, use service `before` hooks to explicitly copy route parameters from `context.params.route` into `context.params.query` and `context.data`.

```ts
app.use('/users/:userId/posts', app.service('posts'))

app.service('users/:userId/posts').hooks({
  before: {
    find: [
      async (context: HookContext) => {
        context.params.query = {
          ...context.params.query,
          userId: context.params.route.userId
        }
      }
    ]
  }
})
```

**Rule 2: Restrict OAuth redirect destinations using allowed origins configuration.**

Configure explicit allowed `origins` in the OAuth configuration to restrict valid post-authentication deep link redirect destinations and prevent open redirection vulnerabilities.

```json
{
  "authentication": {
    "oauth": {
      "origins": ["https://myapp.feathersjs.com", "http://localhost:3000"],
      "redirect": "https://myapp.feathersjs.com/"
    }
  }
}
```

**Rule 3: Scope nested route requests using route context parameters.**

When defining nested routes with path placeholders, use `params.route` to extract URL parameters and scope service logic strictly to the specified parent resource.

```js
app.use('users/:userId/messages', {
  async get(id, params) {
    const userId = params.route.userId
    return {
      id,
      userId,
      text: 'Feathers is great!'
    }
  }
})
```

**Rule 4: Namespace API service routes to prevent routing conflicts.**

Explicitly namespace API service routes under a dedicated path prefix like `/api/` when defining custom Express routes or view rendering paths alongside Feathers services to prevent route collisions and unintended bypass of security hooks.

```js
app.use('/api/messages', memory());

app.get('/messages', function(req, res, next) {
  app.service('api/messages')
    .find({ query: { $sort: { updatedAt: -1 } } })
    .then(result => res.render('message-list', result.data))
    .catch(next);
});
```
