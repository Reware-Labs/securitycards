# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: injection

## injection

### Parameterized Database Queries to Prevent SQL Injection

**Use when**

When executing database queries using database integration plugins, such as `@fastify/mysql` or `@fastify/postgres`, within Fastify route handlers.

**Secure rules**

**Rule 1: Documented database queries use placeholders with parameter arrays**

Fastify's threat model classifies URL parameters as untrusted network input. The documented `@fastify/mysql` query uses a `?` placeholder with `[req.params.id]`, while the documented `@fastify/postgres` query uses `$1` with `[req.params.id]`.

```javascript
fastify.get('/user/:id', function(req, reply) {
  fastify.pg.query(
    'SELECT id, username, hash, salt FROM users WHERE id=$1',
    [req.params.id],
    function onResult (err, result) {
      reply.send(err || result)
    }
  )
})
```


**Source files**

- [`docs/Guides/Database.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Database.md)
