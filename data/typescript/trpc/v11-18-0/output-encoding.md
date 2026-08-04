# Security cards

Repository: `https://github.com/trpc/trpc#v11.18.0`
Category: output encoding

## output encoding

### Use devalue parse and stringify for XSS mitigation

**Use when**

implementing a custom Devalue data transformer for serialization and deserialization

**Secure rules**

**Rule 1: Explicitly use devalue parse and stringify to prevent injection and XSS vulnerabilities**

When configuring a custom Devalue data transformer, explicitly wrap `parse` for deserialization and `stringify` for serialization to ensure built-in XSS mitigations are applied when processing rendered payloads.

```ts
import { parse, stringify } from 'devalue';

export const transformer = {
  deserialize: (object: any) => parse(object),
  serialize: (object: any) => stringify(object),
};
```
