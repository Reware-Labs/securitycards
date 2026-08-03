# Security cards

Repository: `https://github.com/axios/axios#v1.19.0`
Documentation repository: `https://github.com/axios/axios-docs#master`
Category: input contract definition

## input contract definition

### Validate HTTP URL formatting before request dispatch

**Use when**

Making HTTP or HTTPS requests using Axios with untrusted dynamic endpoint URLs.

**Secure rules**

**Rule 1: Validate request URL formatting and handle ERR_INVALID_URL exceptions when processing untrusted URL input.**

Always wrap Axios requests in a try-catch block when utilizing untrusted dynamic endpoints to catch and handle `ERR_INVALID_URL` errors caused by malformed URLs missing double slashes or containing control characters.

```javascript
try {
  const response = await axios.get(userProvidedUrl, { adapter: 'fetch' });
} catch (error) {
  if (error.code === 'ERR_INVALID_URL') {
    // Reject invalid or malformed URL input safely
  }
}
```
