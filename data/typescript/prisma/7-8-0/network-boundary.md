# Security cards

Repository: `https://github.com/prisma/prisma#7.8.0`
Category: network boundary

## network boundary

### Restrict database connections to authorized endpoints

**Use when**

Configuring Prisma Client to connect to a database, especially when using HTTP-based adapters or custom network configurations.

**Secure rules**

**Rule 1: Configure the Neon HTTP adapter with its database connection string.**

When using `PrismaNeonHttp`, store the Neon database connection string in the `JS_NEON_DATABASE_URL` environment variable and pass it to the adapter constructor.

```typescript
const connectionString = `${process.env.JS_NEON_DATABASE_URL as string}`;
const adapter = new PrismaNeonHttp(connectionString, {
  arrayMode: false,
  fullResults: true,
});
```


**Source files**

- [`sandbox/driver-adapters/README.md`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/driver-adapters/README.md)
- [`sandbox/driver-adapters/src/neon.http.ts`](https://github.com/prisma/prisma/blob/7.8.0/sandbox/driver-adapters/src/neon.http.ts)
