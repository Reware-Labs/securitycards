# Security cards

Repository: `https://github.com/graphql/graphql-js#v17.0.2`
Category: interface protocol hardening

## interface protocol hardening

### Configure Explicit CORS and Body Parser Middleware for Protocol Enforcement

**Use when**

Configuring HTTP endpoints and server-level middleware for GraphQL handlers to ensure expected protocol behavior, request methods, and content types.

**Secure rules**

**Rule 1: Configure explicit CORS and body parser middleware before attaching the GraphQL handler.**

Explicitly apply standard middleware such as `cors` and `express.json()` prior to mounting the `createHandler` endpoint to enforce correct method and content type handling.

```js
import express from 'express';
import cors from 'cors';
import { createHandler } from 'graphql-http/lib/use/express';

const app = express();

app.use(cors());
app.use(express.json());
app.all('/graphql', createHandler({ schema }));
```
