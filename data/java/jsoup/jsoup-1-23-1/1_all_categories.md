# Security cards

Repository: `https://github.com/jhy/jsoup#jsoup-1.23.1`

## Category: api contract misuse

### Use correct attribute and selector API signatures and prevent duplicate attributes

**Use when**

When programmatically setting attributes, querying text nodes, or instantiating attributes using Jsoup.

**Secure rules**

**Rule 1: Use Attributes#put() instead of Attributes#add() to set attributes.**

When setting attributes programmatically, use `Attributes#put(key, value)` rather than `Attributes#add(key, value)` to overwrite existing attributes and prevent duplicate attribute names that could cause parser discrepancies or security control bypasses.

```java
element.attributes().put("href", sanitizedUrl);
```

**Rule 2: Use Element#selectNodes() instead of the deprecated matchText selector.**

Avoid using the deprecated `:matchText` pseudo-selector when querying text nodes since it mutates the underlying DOM tree. Instead, use `Element#selectNodes()` with node pseudo-selectors like `::text` or `::textnode` to query text nodes safely without unexpected side-effects.

```java
List<TextNode> textNodes = root.selectNodes("p::text", TextNode.class);
```

**Rule 3: Choose the correct Attribute constructor based on encoding state.**

Use standard constructors like `new Attribute(key, value)` for raw unencoded strings, and restrict `Attribute.createFromEncoded(key, encodedValue)` exclusively to cases where the attribute value is already HTML entity-encoded to prevent unexpected unescaping.

```java
Attribute rawAttr = new Attribute("data-text", "5 &lt; 10");
Attribute encodedAttr = Attribute.createFromEncoded("data-text", "5 &amp;lt; 10");
```


## Category: authentication

### Authenticate Requests Securely Using Jsoup Request Authenticators

**Use when**

When configuring HTTP or proxy authentication for Jsoup connection sessions and requests to verify identity and supply credentials.

**Secure rules**

**Rule 1: Supply authentication credentials safely using RequestAuthenticator and validate request hosts to prevent credential leakage.**

Use Jsoup's `RequestAuthenticator` interface to manage authentication credentials instead of manual headers. Inspect the challenge context using `auth.isServer()` and `auth.isProxy()`, and validate request hosts with `auth.url().getHost()` before returning credentials.

```java
Connection session = Jsoup.newSession()
    .proxy("proxy.example.com", 8080)
    .auth(auth -> {
        if (auth.isServer()) {
            if ("example.com".equalsIgnoreCase(auth.url().getHost())) {
                return auth.credentials("user", "password");
            }
            return null;
        } else {
            return auth.credentials("proxy-user", "proxy-password");
        }
    });
```


## Category: injection

### Prevent Injection When Constructing Dynamic CSS Selectors and Query Parsers

**Use when**

Building dynamic CSS selector queries or regex pseudo-selectors using untrusted user input.

**Secure rules**

**Rule 1: Escape special meta-characters or wrap dynamic strings using Pattern.quote when building regex-based pseudo-selectors.**

Wrap dynamic strings in `Pattern.quote(...)` when building regex-based pseudo-selectors such as `:matches(...)` or `:matchesOwn(...)` with user input to prevent regex injection, parser crashes, or unexpected query alterations.

```java
String userInput = "user(data)";
Elements elements = doc.select("div:matches(" + Pattern.quote(userInput) + ")");
```

**Rule 2: Avoid concatenating untrusted input into CSS selector queries and escape special meta-characters.**

When querying the DOM using Jsoup CSS selector methods such as `select()` or `expectFirst()`, meta-characters including dots, hashes, slashes, and backslashes must be escaped using backslashes to prevent CSS selector injection.

```java
String safeId = untrustedId.replaceAll("([.#/\\\\])", "\\\\$1");
Element el = doc.expectFirst("#" + safeId);

// Or use direct element access without CSS parser syntax
Element directEl = doc.getElementById(untrustedId);
```


## Category: input contract definition

### Validate Element Schemas and HTML Structure Against Defined Allowlist Contracts

**Use when**

When validating untrusted DOM nodes or HTML fragments against expected structure, namespaces, and safelist rules before processing or rendering.

**Secure rules**

**Rule 1: Validate DOM element names and namespaces using elementIs instead of raw string comparisons.**

When validating DOM nodes against expected element schemas or structural contracts, use `elementIs(normalName, namespace)` instead of checking element tag names using raw string comparisons on `tagName()`. This ensures that both normalized element tag names and explicit document namespaces are strictly validated according to the schema rules.

```java
if (element.elementIs("a", Parser.NamespaceHtml)) {
    String href = element.attr("href");
} else {
    throw new IllegalArgumentException("Unexpected element or namespace schema violation");
}
```

**Rule 2: Validate untrusted HTML fragments against an explicit Safelist schema before processing.**

Use `Jsoup.isValid(bodyHtml, safelist)` to validate whether untrusted HTML fragments conform to the schema rules defined by a Safelist allowance structure. Ensure that input validated with `isValid` is still normalized using `Jsoup.clean()` prior to storage or rendering to enforce attributes and parse normalization.

```java
Safelist schema = Safelist.relaxed();
if (!Jsoup.isValid(userInput, schema)) {
    throw new IllegalArgumentException("Input HTML does not match the required schema rules.");
}
String safeHtml = Jsoup.clean(userInput, "https://example.com/", schema);
```


### Validate connection URLs are absolute and use allowed schemes

**Use when**

When accepting external URL strings from users before passing them into `Jsoup.connect()`.

**Secure rules**

**Rule 1: Enforce absolute URLs with explicit http or https schemes before connection processing.**

Verify that input strings start with the required scheme prefix before calling `Jsoup.connect()` to prevent malformed inputs or missing protocols from causing runtime exceptions or unexpected application failures.

```java
String url = "https://example.com/page";
if (url.startsWith("http://") || url.startsWith("https://")) {
    Connection con = Jsoup.connect(url);
    Document doc = con.get();
}
```


## Category: input interpretation safety

### Normalize and Interpret Untrusted Input via Jsoup Parsers and URL Resolution

**Use when**

When parsing untrusted HTML/XML streams, resolving relative URLs, or processing input attributes and character entities.

**Secure rules**

**Rule 1: Ensure XML input is parsed using Parser.xmlParser() rather than standard HTML parsing.**

Developers must ensure that XML input is parsed using `Parser.xmlParser()` rather than standard HTML parsing to prevent misinterpretation of tags, namespaces, or attribute names, avoiding silent mutations or structural corruption.

```java
String xmlData = "<customNS:secureTag xmlns:customNS=\"http://example.com/ns\">value</customNS:secureTag>";
Document doc = Jsoup.parse(xmlData, "", Parser.xmlParser());
String cleanXml = doc.outerHtml();
```

**Rule 2: Resolve URL attributes with Node.absUrl()**

Use `Node.absUrl()` for URL-valued attributes that may be relative. It resolves the attribute against the node's base URI, removes ASCII control characters during resolution, and returns an empty string when an absolute URL cannot be produced. Do not call `StringUtil.resolve()` directly because `StringUtil` is an internal API whose behavior may change without notice.

```java
Document document = Jsoup.parse(
    "<a href=\"../resource\">Resource</a>",
    "https://example.com/path/"
);

String absoluteUrl = document.selectFirst("a").absUrl("href");
if (!absoluteUrl.isEmpty()) {
    // Process the resolved URL.
}
```

**Rule 3: Rely on Jsoup native stream parsing APIs for multibyte and entity-heavy inputs.**

When parsing HTML streams that contain numerous HTML entity references across large inputs, rely directly on Jsoup's native stream parsing APIs such as `Jsoup.parse(InputStream, String, String)` rather than manually pre-chunking or slicing input buffers.

```java
try (InputStream inputStream = new FileInputStream("input.html")) {
    Document doc = Jsoup.parse(inputStream, "UTF-8", "https://example.com/");
    String safeText = doc.body().text();
}
```


## Category: interface protocol hardening

### Control Request Method Retention and Redirect Behavior

**Use when**

Making HTTP POST or HEAD requests where redirect semantics must be explicitly controlled to prevent automatic re-transmission of sensitive payloads across network boundaries.

**Secure rules**

**Rule 1: Disable automatic redirect following when executing sensitive requests that should not re-transmit payloads to redirect locations.**

Be aware of HTTP redirect semantics when making `POST` or `HEAD` requests. Jsoup converts `POST` to `GET` during 301 and 302 redirects, but strictly preserves `POST` for 307 and 308 redirects. Disable redirect following on sensitive requests using `followRedirects(false)` if request payloads should not be automatically re-transmitted to redirect locations.

```java
Connection con = Jsoup.connect("https://example.com/login")
    .method(Connection.Method.POST)
    .requestBody("sensitive_data")
    .followRedirects(false);
Connection.Response res = con.execute();
```


## Category: network boundary

### Route session traffic through configured proxy endpoints

**Use when**

Configuring outbound HTTP/HTTPS connections and sessions to route traffic through authorized proxy endpoints.

**Secure rules**

**Rule 1: Enforce outbound traffic control by configuring proxy parameters on reusable Jsoup connection sessions.**

Use `Jsoup.newSession()` and invoke the `proxy()` method with the appropriate hostname and port to ensure all session requests are routed through the designated proxy gateway.

```java
Connection session = Jsoup.newSession()
    .proxy("10.0.0.1", 8080);

Document doc1 = session.newRequest("http://example.com/page1").get();
Document doc2 = session.newRequest("https://example.com/page2").get();
```


## Category: output encoding

### Escape untrusted strings and serialize documents using safe output settings

**Use when**

When outputting untrusted data into HTML or attribute contexts or serializing documents to string representations.

**Secure rules**

**Rule 1: Use Entities.escape with appropriate OutputSettings to encode characters for target contexts.**

When outputting untrusted strings into HTML or attribute contexts, use `Entities.escape(data, outputSettings)` or `Document.OutputSettings` to encode characters such as `<`, `>`, `&`, `"`, and `
` to prevent Cross-Site Scripting (XSS) or HTML markup injection vulnerabilities.

```java
Document.OutputSettings settings = new Document.OutputSettings()
    .escapeMode(Entities.EscapeMode.base)
    .charset(java.nio.charset.StandardCharsets.UTF_8);
String escapedText = Entities.escape(untrustedInput, settings);
```


## Category: resource exhaustion

### Enforce Resource Limits on Connections and Parsers

**Use when**

fetching and parsing remote content, network connections, or untrusted HTML and XML inputs.

**Secure rules**

**Rule 1: Configure explicit response body limits and connection timeouts.**

Always configure explicit response body limits using `maxBodySize(int bytes)` and timeout limits using `timeout(int)` when fetching content from untrusted network endpoints. Avoid disabling timeouts or limits with a value of `0` to prevent memory exhaustion and denial of service from slow or massive payloads.

```java
Connection conn = Jsoup.connect("https://example.com/data")
    .timeout(15000)
    .maxBodySize(2 * 1024 * 1024);
Document doc = conn.get();
```

**Rule 2: Configure explicit stack depth limits on parser instances for untrusted markup.**

When processing untrusted XML or HTML documents, configure explicit stack depth limits on the `Parser` instance using `Parser#setMaxDepth(int)`. This prevents resource exhaustion and unbounded DOM stack growth caused by deeply nested tags.

```java
Parser parser = Parser.htmlParser();
parser.setMaxDepth(100);
Document doc = parser.parseInput(htmlInput, baseUri);
```


## Category: secret handling

### Isolate authentication contexts and handle credentials securely in connection requests

**Use when**

Configuring request authenticators and handling sensitive headers or session tokens during connection requests across different origins or persistent thread pools.

**Secure rules**

**Rule 1: Set authenticators directly on isolated Connection instances for each request execution to prevent cross-tenant credential leakage.**

Avoid sharing authentication contexts across persistent thread pools where ThreadLocal states might retain sensitive data. Instead, configure authenticators directly on isolated Connection instances for each distinct request execution.

```java
Connection conn = Jsoup.connect("https://example.com/protected")
    .authenticator(ctx -> new PasswordAuthentication(username, password.toCharArray()));
Document doc = conn.get();
```

**Rule 2: Rely on automatic credential stripping on cross-origin redirects to prevent sensitive token leakage.**

Allow Jsoup connection handling to automatically sanitize sensitive headers like `Authorization`, `Cookie`, and `Cookie2` when following redirects across different origins while retaining them for same-origin redirects.

```java
Connection con = Jsoup.connect("https://example.com/login-redirect")
    .header("Authorization", "Bearer secret-token")
    .cookie("session", "sessionIdValue");
Document doc = con.get();
```


## Category: security control integrity

### Configure Safelist instances completely before sharing across concurrent threads

**Use when**

When configuring and sharing Safelist and Cleaner instances across multiple concurrent threads in jsoup applications.

**Secure rules**

**Rule 1: Fully initialize Safelist instances prior to sharing or passing them to cleaner components, and use deep copies to isolate concurrent modifications.**

Safelist objects in jsoup are mutable. To ensure security control integrity across threads, applications must finish configuring a `Safelist` prior to sharing it or passing it to `Cleaner` instances, and must never mutate it while active. To derive a custom variant safely from a shared safelist, always use the deep copy constructor.

```java
Safelist baseSafelist = Safelist.relaxed();

Safelist threadSafelist = new Safelist(baseSafelist)
    .addAttributes("div", "class");

Cleaner cleaner = new Cleaner(threadSafelist);
```


## Category: session management

### Maintain Isolated Session Contexts and Cookies

**Use when**

Managing multi-step HTTP interactions and session state in `Jsoup` connections to preserve isolated path-scoped cookie contexts.

**Secure rules**

**Rule 1: Utilize Jsoup sessions to maintain isolated path-scoped cookie contexts.**

Use `Jsoup.newSession()` when executing multi-step HTTP interactions to ensure path-scoped cookie handling and state isolation. Do not share session objects across unrelated user operations or global contexts.

```java
Connection session = Jsoup.newSession();
session.userAgent("MyApp/1.0");

Document loginDoc = session.newRequest()
    .url("https://example.com/login")
    .data("username", user, "password", pass)
    .post();

Document profileDoc = session.newRequest()
    .url("https://example.com/user/profile")
    .get();
```
