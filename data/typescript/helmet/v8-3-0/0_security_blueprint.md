# Security blueprint

Repository: `https://github.com/helmetjs/helmet#v8.3.0`

## Security posture

The security posture for applications utilizing Helmet requires rigorous validation of middleware initialization parameters and security header configurations. Developers must assume responsibility for properly instantiating factory functions and supplying precise option keys, valid data types, and supported enumerated values to avoid runtime initialization exceptions or insecure defaults. Security-sensitive surfaces include Content Security Policy directives, transport security protocols, and boundary controls that must fail closed when misconfigured.

## Essential implementation rules

1. **Properly Invoke Helmet Middleware and Validate API Options**

Always invoke `helmet()` as a function when passing it to `app.use()` to prevent runtime errors on incoming HTTP requests. Ensure that configuration options use exact property casing, valid non-negative numbers for properties like `maxAge`, and avoid passing conflicting modern header keys and legacy alias keys simultaneously.

2. **Enforce Strict MIME Sniffing Protection Without Invalid Options**

Enable `X-Content-Type-Options: nosniff` using default Helmet middleware or `helmet.xContentTypeOptions()`. Do not pass configuration options to `xContentTypeOptions` since it does not accept options and will log a warning, and avoid mixing it with the legacy `noSniff` key.

3. **Control Resource Embedding via Cross-Origin Policies**

Configure `crossOriginResourcePolicy` and `crossOriginOpenerPolicy` using explicitly supported lowercase policy strings such as `same-origin`, `same-site`, `cross-origin`, or `same-origin-allow-popups`. Supplying invalid types or uppercase values will trigger runtime setup errors.

4. **Secure Content Security Policy Keywords and Directive Escapes**

Enclose CSP keyword sources such as `self`, `none`, `unsafe-inline`, and nonces in single quotes within directive arrays. Use `contentSecurityPolicy.dangerouslyDisableDefaultSrc` exclusively as the value for the `defaultSrc` directive when an advanced edge case requires omitting the fallback, avoiding its use on other directives.

5. **Implement Cryptographic Nonces for Content Security Policy Inline Scripts**

Secure inline scripts without enabling unsafe inline directives by generating a per-request cryptographic nonce and passing a function within `scriptSrc` array directives that dynamically returns the nonce-based policy string.

6. **Harden Transport Security and Protocol Upgrades**

Maintain the `upgrade-insecure-requests` directive enabled in production environments to automatically convert HTTP resource fetches to HTTPS. Configure `strictTransportSecurity` with a sufficiently long `maxAge` specified in seconds to enforce encrypted connections.

7. **Reduce Framework Fingerprinting and Harden Runtime Environment**

Suppress the `X-Powered-By` response header in production environments by disabling it directly via Express or by utilizing Helmet middleware which handles header removal automatically.
