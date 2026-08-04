# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: input driven boundary selection

## input driven boundary selection

### Fail Secure During Async Route Constraint Derivation

**Use when**

Implementing custom asynchronous route constraints to isolate tenant or resource boundaries based on incoming request headers.

**Secure rules**

**Rule 1: Propagate all errors to the callback during custom constraint derivation to prevent fallback route matching.**

When writing an asynchronous `deriveConstraint` function for a custom route strategy (such as tenant boundary selection), ensure any lookup, validation, or system error is immediately passed to the `done` callback as the first argument. This halts request routing and prevents fallback matching to unintended or unconstrained route handlers.

```javascript
const constraint = {
  name: 'tenant',
  storage: () => { /* ... */ },
  deriveConstraint: (req, ctx, done) => {
    getTenantDetails(req.headers['x-tenant-id'], (err, tenant) => {
      if (err) {
        return done(err); // Safely aborts request with a 500 error
      }
      done(null, tenant);
    });
  },
  validate: () => true
};
```


**Source files**

- [`test/constrained-routes.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/constrained-routes.test.js)
