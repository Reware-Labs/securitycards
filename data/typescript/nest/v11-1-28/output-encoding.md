# Security cards

Repository: `https://github.com/nestjs/nest#v11.1.28`
Documentation repository: `https://github.com/nestjs/docs.nestjs.com#master`
Category: output encoding

## output encoding

### Encode Untrusted Data for the Context the Response Places It In

**Use when**

Returning request-derived or stored text inside an HTML response body, or rendering a view with values that originated from a client.

**Secure rules**

**Rule 1: Escape interpolated values when a handler composes an HTML body itself.**

Returning an object from a controller serializes JSON, which the browser does not execute. The exposure appears when a handler builds markup instead: `@Header('Content-Type', 'text/html')` around a concatenated template literal places untrusted values into an executable context, so a stored `<script>` runs under your origin. Escape every interpolated value, and set `X-Content-Type-Options: nosniff` so the browser does not sniff a response into a richer type than it was labelled.

```typescript
import { Controller, Get, Header, Param } from '@nestjs/common';

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeHtml = (value: unknown): string =>
  String(value).replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);

@Controller('profiles')
export class ProfilesController {
  @Get(':id')
  @Header('Content-Type', 'text/html')
  @Header('X-Content-Type-Options', 'nosniff')
  async show(@Param('id') id: string): Promise<string> {
    const profile = await this.profiles.find(id);
    return `<h1>${escapeHtml(profile.name)}</h1>`;
  }
}
```

**Rule 2: Keep view rendering on the escaping interpolation form.**

A template engine registered with `app.setViewEngine()` and used through `@Render()` escapes interpolated values by default, which is why rendering a view is safer than concatenating a string. That default is per-syntax, not per-engine: Handlebars escapes `{{ value }}` but emits `{{{ value }}}` verbatim, and other engines have an equivalent raw form. Reserve the raw form for markup the application itself produced.

```html
<h1>{{ message }}</h1>
```

**Rule 3: Sanitize, rather than escape, when the response is specified to carry caller-supplied markup.**

Escaping is the right answer when the value is text. When an endpoint is specified to return the caller's own markup as `text/html`, escaping it defeats the feature and returning plain text contradicts the contract. Run the value through an allowlist sanitizer that keeps the permitted elements and attributes and drops everything else, including event-handler attributes and `javascript:` URLs. Do not hand-roll the filter with a regular expression; stripping `<script>` does not stop `<img onerror=...>`.

```typescript
import * as sanitizeHtml from 'sanitize-html';

const renderComment = (markup: string): string =>
  sanitizeHtml(markup, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'code'],
    allowedAttributes: { a: ['href', 'title'] },
    allowedSchemes: ['http', 'https', 'mailto'],
  });
```


**Source files**

- [`sample/15-mvc/src/app.controller.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/15-mvc/src/app.controller.ts)
- [`sample/15-mvc/views/index.hbs`](https://github.com/nestjs/nest/blob/v11.1.28/sample/15-mvc/views/index.hbs)
- [`content/techniques/mvc.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/techniques/mvc.md) _(documentation repository)_

### Neutralize Request Data Before It Reaches the Log

**Use when**

Passing request-derived values -- headers, query parameters, body fields, usernames -- to `Logger` or any other logging sink.

**Secure rules**

**Rule 1: Strip newline and control characters before logging a request-derived value.**

A value containing `\n` or `\r` splits one entry into two, letting a caller forge lines that appear to have come from the server and push real events out of the visible window. Replace line breaks and other control characters before the value reaches `Logger`, and cap its length so a single request cannot flood the log. Do this at the point of logging rather than at the point of input, so the protection does not depend on which handler the value arrived through.

```typescript
import { Body, Controller, Logger, Post } from '@nestjs/common';

const sanitizeForLog = (value: unknown, limit = 200): string =>
  String(value)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .slice(0, limit);

@Controller('events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  @Post()
  record(@Body('message') message: string) {
    this.logger.log(`client event: ${sanitizeForLog(message)}`);
    return { status: 'recorded' };
  }
}
```

**Rule 2: Log an identifier for a secret, never the secret itself.**

Tokens, passwords, session identifiers and API keys that reach the log outlive the request in a store with weaker access control than the one they came from, and they survive there in backups. Log a stable non-reversible reference when entries need to be correlated, and keep the value out of the message entirely.

```typescript
import { createHash } from 'crypto';

const tokenReference = (token: string): string =>
  createHash('sha256').update(token).digest('hex').slice(0, 12);

this.logger.log(`authenticated request for token ${tokenReference(token)}`);
```


**Source files**

- [`packages/common/services/console-logger.service.ts`](https://github.com/nestjs/nest/blob/v11.1.28/packages/common/services/console-logger.service.ts)
- [`packages/common/services/logger.service.ts`](https://github.com/nestjs/nest/blob/v11.1.28/packages/common/services/logger.service.ts)
- [`content/techniques/logger.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/techniques/logger.md) _(documentation repository)_
