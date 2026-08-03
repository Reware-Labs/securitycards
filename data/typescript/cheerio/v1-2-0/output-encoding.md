# Security cards

Repository: `https://github.com/cheeriojs/cheerio#v1.2.0`
Category: output encoding

## output encoding

### Set HTML attributes using .attr() to prevent attribute breakout and injection

**Use when**

Setting dynamic attribute values on elements before serializing them back to HTML using Cheerio.

**Secure rules**

**Rule 1: Always use Cheerio's .attr(key, value) method to set dynamic attribute values instead of manually concatenating untrusted strings into raw HTML markup.**

Cheerio automatically encodes special HTML characters and quote delimiters when serializing elements back to HTML via `.html()`, preventing attribute breakout and HTML injection.

```typescript
import * as cheerio from 'cheerio';

const $ = cheerio.load('<a id="link">User Link</a>');

// Safe: .attr() escapes dangerous characters when rendering HTML
$('#link').attr('href', untrustedUserInput);
const html = $.html();
```
