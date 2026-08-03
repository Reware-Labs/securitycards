# Security blueprint

Repository: `https://github.com/cheeriojs/cheerio#v1.2.0`

## Security posture

When using Cheerio for parsing and manipulating HTML and XML, developers must assume that inputs may be untrusted, malformed, or mal-encoded. While the library handles automatic output encoding and safe attribute assignments by default, it does not inherently protect against remote server failures, encoding mismatches, or full document wrapping issues when parsing fragments. Security-sensitive surfaces include stream handling, remote URL loading, parser configuration options, and dynamic pseudo-selectors, where misuse should fail closed or be safely caught through explicit validation.

## Essential implementation rules

1. **Use correct stream APIs for binary buffers**

Call `decodeStream` or `loadBuffer` when reading binary buffer streams so that encoding is handled properly without runtime errors caused by strict input contract enforcement.

2. **Disable full document mode when parsing HTML fragments**

Pass `false` as the third argument to `cheerio.load()` when parsing partial markup fragments rather than full HTML documents to prevent implicit root wrapping.

3. **Handle exceptions when loading remote documents from URLs**

Wrap `cheerio.fromURL()` calls in try/catch blocks and handle `RangeError` and other validation exceptions to safely manage invalid content types or server errors.

4. **Use stream decoding loaders for binary buffers and streams**

Use `cheerio.decodeStream()` or `cheerio.loadBuffer()` when processing binary buffers or unknown stream payloads to handle character encoding sniffing and avoid stream parser failures.

5. **Configure parser options explicitly for malformed input and XML handling**

Pass explicit parser configuration objects under the `xml` option key or configure options like `scriptingEnabled` to ensure predictable DOM construction when handling malformed or non-standard markup.

6. **Escape reserved characters in dynamic pseudo-selectors**

Escape reserved meta-characters such as closing parentheses using backslashes when inserting dynamic search terms into pseudo-selectors like `:contains()`.

7. **Validate return types when reading parsed data attributes**

Check and validate the returned data type from `.data()` calls rather than assuming JSON-formatted attributes were successfully parsed.

8. **Safely parse malformed HTML fragments using parseHTML**

Rely on `$.parseHTML()` to safely handle malformed HTML fragments, check for `null` return values, and let it automatically strip `<script>` nodes by default.

9. **Set HTML attributes using .attr() to prevent attribute breakout and injection**

Always use Cheerio's `.attr(key, value)` method to set dynamic attribute values instead of manually concatenating untrusted strings into raw HTML markup.
