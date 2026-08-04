# Security cards

Repository: `https://github.com/trpc/trpc#v11.18.0`
Category: authentication

## authentication

### Extract and Verify Caller Credentials in tRPC Context Setup

**Use when**

Configuring context creation for incoming HTTP requests, WebSocket connections, or serverless adapters to ensure caller identity is cryptographically verified on every request.

**Secure rules**

**Rule 1: Extract and cryptographically verify authentication tokens or session credentials within the `createContext` helper for every request.**

Parse authorization headers or connection parameters within `createContext` and perform token validation before attaching the resulting user identity to the context object. Ensure unauthenticated requests resolve to an explicit null or unauthenticated user state rather than trusting raw payload inputs.

```typescript
export async function createContext({ req, res }: CreateHTTPContextOptions) {
  async function getUserFromHeader() {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      return await decodeAndVerifyJwtToken(token);
    }
    return null;
  }
  const user = await getUserFromHeader();
  return { user };
}
```

**Rule 2: Authenticate WebSocket connections by validating connection parameters in the server context setup.**

Pass credentials via `connectionParams` on the client `createWSClient` call and inspect and validate those parameters inside `createContext` via `opts.info.connectionParams`.

```typescript
const wsClient = createWSClient({
  url: 'ws://localhost:3000',
  connectionParams: async () => {
    return { token: 'user-auth-token' };
  },
});

export const createContext = async (opts: CreateWSSContextFnOptions) => {
  const token = opts.info.connectionParams?.token;
  const user = await verifyAuthToken(token);
  return { user };
};
```
