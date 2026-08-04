# Security cards

Repository: `https://github.com/axios/axios#v1.19.0`
Documentation repository: `https://github.com/axios/axios-docs#master`
Category: injection

## injection

### Sanitize and Encode Header Values to Prevent HTTP Header Injection

**Use when**

Setting custom request headers or handling dynamic inputs intended for HTTP headers.

**Secure rules**

**Rule 1: Use `AxiosHeaders` methods or standard request configuration headers along with explicit encoding to neutralize untrusted input before header dispatch.**

Axios automatically strips carriage returns, line feeds, and null bytes to protect against HTTP header injection, but non-ASCII characters and arbitrary strings should be explicitly encoded or validated. Assign dynamic values through `AxiosHeaders` or standard request config headers to ensure sanitization is invoked, and wrap non-ASCII values using `encodeURIComponent`.

```javascript
import axios, { AxiosHeaders } from 'axios';

const headers = new AxiosHeaders();
headers.set('x-user-name', encodeURIComponent(untrustedUserName));

axios.get('https://example.com/api', { headers });
```
