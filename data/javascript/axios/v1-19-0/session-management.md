# Security cards

Repository: `https://github.com/axios/axios#v1.19.0`
Documentation repository: `https://github.com/axios/axios-docs#master`
Category: session management

## session management

### Configure withCredentials for cross-origin session authentication

**Use when**

When making requests from a frontend application to a cross-origin API that relies on session cookies for authentication.

**Secure rules**

**Rule 1: Enable withCredentials on Axios client instances when communicating with cross-origin APIs dependent on session cookies.**

Set `withCredentials: true` on the Axios client configuration to ensure that browser session cookies are automatically attached and transmitted with cross-origin requests.

```js
const api = axios.create({
  baseURL: "https://api.example.com",
  withCredentials: true
});
```
