# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: dangerous execution

## dangerous execution

### Define Fastify Schemas Statically to Prevent Server-Side Code Execution

**Use when**

When defining input validation and serialization schemas for Fastify routes, including querystrings, parameters, request bodies, and responses.

**Secure rules**

**Rule 1: Avoid compiling schemas constructed from untrusted user input**

Do not dynamically construct or build schemas using user-controlled parameters. Because Fastify's underlying validation (Ajv) and serialization (fast-json-stringify) engines compile these definitions into executable JavaScript code using the `new Function()` constructor, dynamically building schemas with untrusted input can lead to arbitrary server-side code execution. Always define route, query, parameter, and response schemas as static, hardcoded structures within your application code.

```javascript
const bodySchema = {
  type: 'object',
  properties: {
    username: { type: 'string' }
  },
  required: ['username']
};

fastify.post('/register', { schema: { body: bodySchema } }, handler);
```


### Evaluate submitted expressions with a parser, not the JavaScript engine

**Use when**

A request supplies an expression, formula, or template that the application computes a result from.

**Secure rules**

**Rule 1: Never pass request data to `eval`, `new Function`, or `node:vm`.**

Each of these compiles its input as JavaScript with the process's full authority, so an endpoint that evaluates arithmetic also runs `require('node:child_process')`. `node:vm` is a sandbox for isolating trusted code, not a security boundary against hostile input, and its context is escapable. Parse the input with a grammar that accepts only the operators the feature needs and evaluate the resulting tree yourself.

```javascript
// Only digits, the four operators, parentheses, and spaces reach the parser.
const ARITHMETIC = /^[0-9+\-*/(). ]{1,100}$/;

fastify.post('/calculate', async (request, reply) => {
  const { expression } = request.body;
  if (!ARITHMETIC.test(expression)) {
    return reply.code(400).send({ error: 'unsupported expression' });
  }
  return { result: evaluateArithmetic(expression) }; // own parser, never eval
});
```

**Rule 2: Bound the work a submitted expression is allowed to perform.**

An expression that is syntactically harmless can still be expensive: deep nesting or a very large exponent consumes CPU for as long as the evaluator runs. Cap the input length and the nesting depth the parser accepts, and reject rather than truncate so the caller sees a clear error.

```javascript
const MAX_DEPTH = 16;

function parse(tokens, depth = 0) {
  if (depth > MAX_DEPTH) {
    throw new Error('expression nested too deeply');
  }
  // ...
}
```

**Source files**

- [`docs/Reference/Validation-and-Serialization.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Validation-and-Serialization.md)
