# Security blueprint

Repository: `https://github.com/psf/requests#v2.34.2`

## Security posture

When working within the requests library, developers must assume responsibility for securing outbound HTTP interactions, dynamic boundaries, and sensitive data flows. The framework provides underlying capabilities for connection pooling, header management, and authentication, but does not inherently protect against untrusted URLs, unmanaged resource exhaustion, or misconfigured environment settings. Security-sensitive surfaces include URL parsing, proxy configurations, credential forwarding, and response payload handling, all of which must fail closed when invalid states or ambiguous protocol responses occur.

## Essential implementation rules

1. **Verify Response Status Codes Before Payload Parsing**

Always call `r.raise_for_status()` or explicitly verify response status codes before parsing payloads with methods like `r.json()`. Successful method execution only indicates formatting validity, not business success, preventing applications from ingesting error responses as valid data.

2. **Implement Custom Authentication via AuthBase and Manage Redirects**

Implement custom authentication mechanisms by subclassing `requests.auth.AuthBase` to encapsulate token injection safely. When using `HTTPDigestAuth`, set `allow_redirects=False` if redirected requests must not retain credentials.

3. **Validate Target URL Schemes and Domain Boundaries**

Perform strict validation on dynamic or user-supplied URLs to ensure explicit and safe URI schemes like `https` or `http` and valid network locations before passing them to execution functions.

4. **Disable Environment and .netrc Loading in Untrusted Contexts**

Set `trust_env = False` on requests `Session` objects in multi-tenant, serverless, or untrusted execution environments to prevent implicit configuration overrides from local environment variables and `.netrc` files.

5. **Use Atomic File Opening for Secure Disk Writes**

Use `atomic_open()` when creating or updating files on disk to safely write data to a temporary location before atomically replacing the final destination path, avoiding race conditions and partially written data exposure.

6. **Restrict Non-Standard JSON Numeric Formats**

Avoid passing out-of-spec numeric values such as `float('nan')` or `float('inf')` into JSON request payloads via the `json` parameter to prevent parser desynchronization or `InvalidJSONError` exceptions.

7. **Handle Conflicting Content-Length Headers**

Wrap request execution blocks in `try` and `except requests.exceptions.InvalidHeader:` to properly handle malformed or ambiguous protocol responses containing conflicting `Content-Length` headers.

8. **Configure Explicit Proxy Schemes and Scope no_proxy Entries**

Include explicit schemes in proxy URLs and scope `no_proxy` entries strictly to intended bypass destinations, keeping in mind that IPv4 entries, CIDR ranges, and hostname boundaries match according to standard library rules.

9. **Enforce Explicit Timeouts and Streaming Context Managers**

Specify explicit connection and read timeouts on all request calls to prevent thread exhaustion, and wrap streaming requests made with `stream=True` inside `with` statement blocks to ensure connections close properly.

10. **Protect Credentials and Provide Explicit Types**

Disable automatic netrc authentication via `trust_env` when unintended, and pass username and password arguments as explicit string or byte types compatible with `latin1` encoding to basic authentication handlers.

11. **Merge Environment Settings for Manually Prepared Requests**

Call `Session.merge_environment_settings` when sending manually prepared requests with `Session.send()` to ensure system trust stores, custom CA bundles, and environment configurations are consistently applied.

12. **Configure Secure and Domain-Restricted Session Cookies**

Explicitly define the `domain`, `path`, and set `secure=True` when creating session cookies via `requests.cookies.create_cookie()` or when adding them to a `RequestsCookieJar` to prevent supercookie behavior and unencrypted transmission.
