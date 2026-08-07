# Security cards

Repository: `https://github.com/flutter/flutter#3.44.8`
Category: input interpretation safety

## input interpretation safety

### Parse and validate string representations using unambiguous rules and explicit schemes

**Use when**

When parsing untrusted representations, configuration files, localization messages, or command-line option inputs in Flutter applications and tooling.

**Secure rules**

**Rule 1: Canonicalize and escape special syntax in localization messages to prevent parser misinterpretation.**

When parsing ICU localization messages with escaping enabled in Flutter localization tools (`gen_l10n`), ensure single quotes are properly escaped by doubling them or enclosing literal blocks in single quotes. Unmatched single quotes trigger syntax lexing failures and prevent ambiguous placeholder boundary interpretation.

```json
"greeting": "Flutter''s amazing!",
"literal": "'{ escaped string }' { placeholder }"
```

**Rule 2: Enforce explicit schemes and URI canonicalization for external server configuration inputs.**

When configuring Flutter command options for external DevTools servers via flags such as `--devtools-server-address`, supply a fully qualified URI containing an explicit scheme. Verify that the input parses successfully and includes a valid scheme before passing it to command runners to prevent malformed fallback parsing.

```dart
final String address = 'http://127.0.0.1:9105';
final Uri? parsed = Uri.tryParse(address);
if (parsed != null && parsed.hasScheme) {
  // Pass verified scheme URI to flutter command runners
}
```
