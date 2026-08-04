# Security cards

Repository: `https://github.com/cheeriojs/cheerio#v1.2.0`
Category: api contract misuse

## api contract misuse

### Use correct stream APIs for binary buffers

**Use when**

When processing binary buffer streams or multi-byte encoded inputs with Cheerio.

**Secure rules**

**Rule 1: Use decodeStream or loadBuffer instead of stringStream when processing binary streams.**

Call `decodeStream` when reading binary buffer streams so that encoding is handled properly without runtime errors caused by strict input contract enforcement.

```typescript
import * as cheerio from 'cheerio';

const stream = cheerio.decodeStream({}, (err, $) => {
  if (err) {
    console.error('Failed to parse stream', err);
    return;
  }
  console.log($.html());
});

stream.write(Buffer.from('<h1>Title</h1>', 'utf-8'));
stream.end();
```
