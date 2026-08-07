# Security cards

Repository: `https://github.com/spring-projects/spring-security#7.1.0`
Category: resource exhaustion

## resource exhaustion

### Exchange Long-Term Password Credentials for Short-Term Tokens During Authentication

**Use when**

Handling initial user authentication and subsequent requests to prevent CPU and memory exhaustion caused by repeated password hashing.

**Secure rules**

**Rule 1: Exchange long-term credentials for short-term tokens upon successful authentication rather than re-evaluating password hashes on every request.**

Authenticate user credentials once during login to establish an HTTP session or issue an access token, and subsequently validate only the session or token on incoming requests. Re-evaluating adaptive one-way hashing functions on every request consumes excessive CPU and memory resources, leading to resource exhaustion and denial-of-service vulnerabilities.
