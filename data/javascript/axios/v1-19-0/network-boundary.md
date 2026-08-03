# Security cards

Repository: `https://github.com/axios/axios#v1.19.0`
Documentation repository: `https://github.com/axios/axios-docs#master`
Category: network boundary

## network boundary

### Configure trusted proxy settings and bypass rules for secure network boundaries

**Use when**

Configuring network proxy options and `NO_PROXY` bypass rules for Axios requests across corporate or restricted network boundaries.

**Secure rules**

**Rule 1: Use HTTPS targets and explicitly declare HTTPS proxy protocols**

For end-to-end TLS to the origin, request an `https://` target so Axios’s Node adapter uses a CONNECT tunnel. When the configured proxy server itself uses HTTPS, set `proxy.protocol` to `https` explicitly. Axios sends proxy credentials on the CONNECT request rather than inside the origin TLS connection and re-evaluates its proxy configuration across redirects.

```js
import axios from 'axios';

export function fetchThroughSecureProxy() {
  return axios.get('https://api.example.com/data', {
    proxy: {
      protocol: 'https',
      host: 'proxy.example.com',
      port: 8443,
    },
  });
}
```

**Rule 2: Construct NO_PROXY environment variables using canonical formats and domain wildcards.**

Set `NO_PROXY` using standard domain patterns and canonical IP formats to ensure Axios correctly normalizes host representations and prevents security proxy bypass evasion.

```javascript
process.env.NO_PROXY = 'localhost,127.0.0.1,::1,*.internal.domain:8080';

await axios.get('http://[::ffff:127.0.0.1]:8080/api/health');
```
