# Security blueprint

Repository: `https://github.com/jhy/jsoup#jsoup-1.23.1`

## Security posture

When developing with Jsoup, developers must assume that all inputs, including HTML, XML, URLs, CSS selectors, and HTTP responses, are untrusted and potentially malicious. The library protects against standard parsing anomalies and provides robust safelist-based sanitization and request handling, but it does not protect against logic flaws, injection vulnerabilities, or resource exhaustion unless explicit safety rules and limits are enforced. Security-sensitive surfaces include dynamic query construction, connection parameter configuration, schema validation, and session management, where failures should always fail closed.

## Essential implementation rules

1. **Use correct attribute and selector API signatures**

When setting attributes programmatically, use `Attributes#put(key, value)` rather than `Attributes#add(key, value)` to overwrite existing attributes and prevent duplicate attribute names that could cause parser discrepancies or security control bypasses. Choose standard constructors like `new Attribute(key, value)` for raw unencoded strings, and restrict `Attribute.createFromEncoded(key, encodedValue)` exclusively to cases where the attribute value is already HTML entity-encoded.

2. **Authenticate connection sessions securely**

Use Jsoup's `RequestAuthenticator` interface to manage authentication credentials instead of manual headers. Inspect the challenge context using `auth.isServer()` and `auth.isProxy()`, and validate request hosts with `auth.url().getHost()` before returning credentials. Set authenticators directly on isolated Connection instances for each request execution to prevent cross-tenant credential leakage.

3. **Prevent injection in CSS selectors and regex pseudo-selectors**

Wrap dynamic strings in `Pattern.quote(...)` when building regex-based pseudo-selectors such as `:matches(...)` or `:matchesOwn(...)` with user input to prevent regex injection. When querying the DOM using Jsoup CSS selector methods such as `select()` or `expectFirst()`, meta-characters must be escaped or direct element access methods like `getElementById()` should be used.

4. **Validate schemas, HTML fragments, and connection URLs**

Validate DOM nodes against expected element schemas using `elementIs(normalName, namespace)` instead of raw string comparisons on `tagName()`. Validate untrusted HTML fragments against an explicit Safelist schema using `Jsoup.isValid()`, and normalize valid inputs using `Jsoup.clean()`. Verify that input connection strings start with absolute `http://` or `https://` schemes before calling `Jsoup.connect()`.

5. **Normalize and interpret inputs with appropriate parsers**

Ensure XML input is parsed using `Parser.xmlParser()` rather than standard HTML parsing to prevent tag misinterpretation and structural corruption. Use `Node.absUrl()` for URL-valued attributes that may be relative to resolve against the base URI securely, and rely on native stream parsing APIs such as `Jsoup.parse(InputStream, String, String)` for entity-heavy inputs.

6. **Control request methods, redirects, and proxy endpoints**

Disable automatic redirect following using `followRedirects(false)` on sensitive `POST` or `HEAD` requests to prevent the automatic re-transmission of sensitive payloads across network boundaries. Enforce outbound traffic control and isolate session requests by configuring proxy parameters on reusable connection sessions using `Jsoup.newSession()` and invoking `proxy()`.

7. **Escape untrusted strings and serialize output safely**

When outputting untrusted strings into HTML or attribute contexts, use `Entities.escape(data, outputSettings)` or `Document.OutputSettings` to encode characters such as `<`, `>`, `&`, `"`, and `
` to prevent Cross-Site Scripting (XSS) and HTML markup injection vulnerabilities.

8. **Enforce explicit resource limits on connections and parsers**

Configure explicit response body limits using `maxBodySize(int bytes)` and timeout limits using `timeout(int)` when fetching content from untrusted network endpoints to prevent denial of service. When processing untrusted XML or HTML documents, configure explicit stack depth limits on the `Parser` instance using `Parser#setMaxDepth(int)` to prevent resource exhaustion from deeply nested tags.

9. **Maintain thread safety and isolation for Safelists and sessions**

Fully initialize `Safelist` instances prior to sharing or passing them to cleaner components, and use deep copy constructors to isolate concurrent modifications. Use `Jsoup.newSession()` when executing multi-step HTTP interactions to maintain path-scoped cookie contexts and state isolation.
