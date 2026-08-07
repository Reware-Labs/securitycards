# Security cards

Repository: `https://github.com/tj/commander.js#v15.0.0`
Category: output encoding

## output encoding

### Sanitize Untrusted User Inputs Rendered in Custom CLI Output

**Use when**

When configuring custom output hooks via `program.configureOutput()` to handle error messages or command output containing untrusted user input before rendering to stdout or stderr streams.

**Secure rules**

**Rule 1: Sanitize or encode untrusted user-supplied input contained within error messages or command output before applying styling or printing to terminal streams.**

Ensure that any command-line arguments or option values supplied by users are properly sanitized to remove terminal escape sequences or control characters, preventing terminal injection attacks when echoed back through custom output hooks like `writeErr` or `outputError`.

```javascript
program.configureOutput({
  writeErr: (str) => process.stderr.write(str.replace(/\x1b/g, '')),
  outputError: (str, write) => write(`\x1b[31m${str.replace(/\x1b/g, '')}\x1b[0m`)
});
```
