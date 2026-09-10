# Security cards

Repository: `https://github.com/axios/axios#v1.19.0`
Documentation repository: `https://github.com/axios/axios-docs#master`
Category: input driven boundary selection

## input driven boundary selection

### Encode user-controlled IDs as single URL path segments

**Use when**

Building a request path from an opaque user ID and an application-controlled `baseURL` and route prefix in Axios.

**Secure rules**

**Rule 1: Validate the ID and encode it as one path segment before constructing the request URL.**

Removing leading slashes does not protect the rest of a URL component: `../admin` can resolve outside `/users/`, `?` starts a query, and `#` truncates what is sent to the server. Encode the original ID with `encodeURIComponent()` instead of deleting characters or accepting it as a URL. This preserves spaces, Unicode, and reserved characters as ID data. Reject empty or non-string values and the standalone IDs `.` and `..`, because URL parsing normalizes those dot segments even when their dots are percent-encoded.

```javascript
const api = axios.create({
  baseURL: 'https://api.example.com'
});

function fetchUserData(userId) {
  if (typeof userId !== 'string' || userId === '' || userId === '.' || userId === '..') {
    throw new TypeError('userId must be a non-empty string other than . or ..');
  }

  return api.get(`/users/${encodeURIComponent(userId)}`);
}
```

This example constrains the initial URL Axios constructs. Apply the server's ID contract as well: if its router or proxy treats encoded slashes as separators or decodes more than once, reject those IDs or send them as query data. Validate redirects separately when the destination must remain restricted. `baseURL` and `allowAbsoluteUrls: false` do not constrain relative path traversal.

**Source files**

- [`lib/core/buildFullPath.js`](https://github.com/axios/axios/blob/v1.19.0/lib/core/buildFullPath.js)
- [`lib/helpers/combineURLs.js`](https://github.com/axios/axios/blob/v1.19.0/lib/helpers/combineURLs.js)
- [URL Standard: URL path segments](https://url.spec.whatwg.org/#url-path-segment)
