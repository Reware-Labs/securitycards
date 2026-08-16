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


### Separate command arguments from command syntax

**Use when**

Invoking an external program with a value that came from a request.

**Secure rules**

**Rule 1: Pass arguments as an array with `execFile` or `spawn`, never as a concatenated shell string.**

`exec` hands its argument to a shell, so `;`, backticks, and `$(...)` inside a request value are read as commands rather than data. `execFile` and `spawn` take the program and an argument array and start the process directly, with no shell to interpret. Leave `shell` at its default of `false`; enabling it reintroduces the same parsing.

```javascript
const { execFile } = require('node:child_process');

fastify.post('/convert', async (request, reply) => {
  const { source } = request.body;
  const output = await new Promise((resolve, reject) => {
    execFile('convert', [source, '-resize', '100x100', 'out.png'], (error, stdout) =>
      error ? reject(error) : resolve(stdout));
  });
  return { status: 'converted', output };
});
```

**Rule 2: Reject argument values that begin with a dash.**

Without a shell the value is no longer a command, but the program still parses its own arguments, so a value such as `--output=/etc/passwd` becomes an option rather than the filename the handler intended. Check the leading character and reject before invoking. A `--` end-of-options separator helps where the program supports it, but not every program does, so the leading-dash check is the guard to rely on.

```javascript
if (source.startsWith('-')) {
  return reply.code(400).send({ error: 'invalid source' });
}
```

**Source files**

- [`docs/Guides/Database.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Guides/Database.md)
