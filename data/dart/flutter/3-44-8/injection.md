# Security cards

Repository: `https://github.com/flutter/flutter#3.44.8`
Category: injection

## injection

### Prevent Template and Expression Injection in Flutter Tools and Web Builds

**Use when**

Developing or building Flutter applications, handling custom web-define configurations, rendering templates, or utilizing dynamic expression evaluation and compilation APIs.

**Secure rules**

**Rule 1: Escape dynamic variables using escapeYamlString when rendering YAML templates.**

When substituting dynamic variables such as branch names or user inputs into YAML templates, format variables using `escapeYamlString` to safely enclose inputs in double quotes and escape special control characters.

```dart
final String safeBranch = escapeYamlString(userBranch);
final String yamlContent = 'default_branch: $safeBranch';
```


### Supply CSP Nonces and Selector Prefixes When Attaching Global Styles

**Use when**

Injecting or attaching global styles dynamically within web applications targeting Flutter 3.44.8.

**Secure rules**

**Rule 1: Always supply a valid Content Security Policy nonce and scope styles with a selector prefix when attaching global styles dynamically.**

When dynamically inserting style elements via `StyleManager.attachGlobalStyles`, pass the active host CSP nonce through the `styleNonce` parameter and scope the styles using `cssSelectorPrefix`. This prevents style execution failures, avoids relying on unsafe inline policy headers, and mitigates CSS injection and global rule pollution.

```dart
StyleManager.attachGlobalStyles(
  node: flutterViewElement,
  styleId: 'flutter-global-styles',
  styleNonce: cspNonceValue,
  cssSelectorPrefix: DomManager.flutterViewTagName,
);
```
