# Security cards

Repository: `https://github.com/sveltejs/kit#@sveltejs/kit@2.70.1`
Category: cryptography

## cryptography

### Use Web Crypto API for secure random identifier generation

**Use when**

Generating secure tokens, identifiers, or random values in SvelteKit applications

**Secure rules**

**Rule 1: Use the standard global Web Crypto API for generating secure random identifiers instead of insecure pseudo-random generators**

Use `crypto.randomUUID()` when you need cryptographically secure random values or identifiers in your SvelteKit application. Avoid using `Math.random()` for security-sensitive operations because pseudo-random generators are predictable and expose the application to session hijacking, enumeration, or forgery attacks.

```javascript
const uniqueToken = crypto.randomUUID();
```
