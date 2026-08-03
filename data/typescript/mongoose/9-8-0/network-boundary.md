# Security cards

Repository: `https://github.com/automattic/mongoose#9.8.0`
Category: network boundary

## network boundary

### Restrict MongoDB network access to trusted IP ranges

**Use when**

Configuring database cluster network connections and firewall rules to restrict network access.

**Secure rules**

**Rule 1: Use TLS and keep certificate validation enabled in production**

Enable TLS when connecting with a `mongodb://` URI. Keep Mongoose's default TLS certificate validation enabled in production; do not enable `tlsAllowInvalidCertificates` or `tlsInsecure`. When the server certificate requires a specific certificate authority, configure `tlsCAFile` with the allowed CA certificate.

```javascript
await mongoose.connect('mongodb://127.0.0.1:27017/test', {
  tls: true,
  tlsCAFile: `${__dirname}/rootCA.pem`
});
```
