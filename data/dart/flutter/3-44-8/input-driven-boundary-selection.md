# Security cards

Repository: `https://github.com/flutter/flutter#3.44.8`
Category: input driven boundary selection

## input driven boundary selection

### Anchor regex proxy rules to enforce path boundaries

**Use when**

Routing and rewriting web requests to upstream backend servers using proxy rules.

**Secure rules**

**Rule 1: Anchor regular expression proxy rules with explicit start anchors to enforce path boundaries.**

Always define regex patterns with explicit start anchors (^) using `RegExp` to ensure matching occurs strictly from the start of the path, preventing unexpected request routing or bypassing access control boundaries.

```dart
final rule = RegexProxyRule(
  pattern: RegExp(r'^/api/v1/users/(.*)'),
  target: 'http://localhost:8080/users/',
  replacement: r'$1',
);
```

**Rule 2: Prevent unanchored regex patterns from matching substrings anywhere in requested URI paths.**

Avoid unanchored proxy rules that match arbitrary substrings, which can lead to double path substitution or unintended access to internal services.
