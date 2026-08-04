# Security cards

Repository: `https://github.com/cheeriojs/cheerio#v1.2.0`
Category: input interpretation safety

## input interpretation safety

### Safely Parse Malformed, Remote, Stream, and Fragment HTML Inputs

**Use when**

Parsing untrusted, malformed, remote, binary, or partial HTML and XML content using Cheerio.

**Secure rules**

**Rule 1: Disable full document mode when parsing HTML fragments**

Pass `false` as the third argument to `cheerio.load()` when parsing partial markup fragments rather than full HTML documents to prevent implicit root wrapping.

```ts
import * as cheerio from 'cheerio';

const $ = cheerio.load('<li>Apple</li><li>Banana</li>', {}, false);
```

**Rule 2: Handle exceptions when loading remote documents from URLs**

Wrap `cheerio.fromURL()` calls in try/catch blocks and handle `RangeError` and other validation exceptions to safely manage invalid content types or server errors.

```ts
import * as cheerio from 'cheerio';

try {
  const $ = await cheerio.fromURL('https://example.com/data');
} catch (err) {
  if (err instanceof RangeError) {
    console.error('Invalid content type');
  }
}
```

**Rule 3: Use stream decoding loaders for binary buffers and streams**

Use `cheerio.decodeStream()` or `cheerio.loadBuffer()` when processing binary buffers or unknown stream payloads to handle character encoding sniffing and avoid stream parser failures.

```ts
import * as cheerio from 'cheerio';

const stream = cheerio.decodeStream({}, (err, $) => {
  if (err) return;
  console.log($.html());
});
stream.write(Buffer.from('<h1>Hello</h1>'));
stream.end();
```

**Rule 4: Configure parser options explicitly for malformed input and XML handling**

Pass explicit parser configuration objects under the `xml` option key or configure options like `scriptingEnabled` to ensure predictable DOM construction when handling malformed or non-standard markup.

```ts
import * as cheerio from 'cheerio';

const $ = cheerio.load('<root><item>content</item></root>', {
  xml: {
    xmlMode: true,
    lowerCaseTags: false,
  },
});
```

**Rule 5: Escape reserved characters in dynamic pseudo-selectors**

Escape reserved meta-characters such as closing parentheses using backslashes when inserting dynamic search terms into pseudo-selectors like `:contains()`.

```ts
import * as cheerio from 'cheerio';

const escapedQuery = String.raw`:contains('\)aaa')`;
const elements = $(escapedQuery);
```

**Rule 6: Validate return types when reading parsed data attributes**

Check and validate the returned data type from `.data()` calls rather than assuming JSON-formatted attributes were successfully parsed.

```ts
import * as cheerio from 'cheerio';

const $ = cheerio.load('<div data-config="{invalid json}"></div>');
const config = $('div').data('config');
if (typeof config === 'object' && config !== null) {
  // Valid object
}
```

**Rule 7: Safely parse malformed HTML fragments using parseHTML**

Rely on `$.parseHTML()` to safely handle malformed HTML fragments, check for `null` return values, and let it automatically strip `<script>` nodes by default.

```ts
import * as cheerio from 'cheerio';

const nodes = $.parseHTML('<script>alert(1)</script><div>Safe</div>') ?? [];
```
