# Security cards

Repository: `https://github.com/axios/axios#v1.19.0`
Documentation repository: `https://github.com/axios/axios-docs#master`
Category: api contract misuse

## api contract misuse

### Configure validateStatus to correctly handle HTTP response status codes

**Use when**

Configuring Axios requests when custom response status validation or proper error throwing on 4xx or 5xx status codes is required.

**Secure rules**

**Rule 1: Provide a correct `validateStatus` function that ensures HTTP error responses reject the promise.**

Use the `validateStatus` configuration option to explicitly verify that the HTTP status code falls within the successful 200-299 range, preventing 4xx or 5xx error responses from resolving as successful domain data.

```javascript
axios.get('/api/resource', {
  validateStatus: (status) => status >= 200 && status < 300
});
```
