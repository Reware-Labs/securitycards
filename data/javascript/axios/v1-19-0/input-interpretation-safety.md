# Security cards

Repository: `https://github.com/axios/axios#v1.19.0`
Documentation repository: `https://github.com/axios/axios-docs#master`
Category: input interpretation safety

## input interpretation safety

### Parse Header Directives with AxiosHeaders to Prevent Prototype Pollution

**Use when**

Parsing untrusted HTTP header directives and parameters where keys must be safely interpreted without allowing prototype pollution.

**Secure rules**

**Rule 1: Import `AxiosHeaders` from Axios’s public entry point when parsing header parameters**

Use the public `AxiosHeaders.parseParameters()` API to parse parameterized header values. It returns a null-prototype parameter map, normalizes parameter names, handles quoted values, and excludes the dangerous keys `__proto__`, `constructor`, and `prototype`. Do not import `axios/lib/core/AxiosHeaders.js`, because that internal subpath is not exported by the package.

```js
import { AxiosHeaders } from 'axios';

const parameters = AxiosHeaders.parseParameters(
  'attachment; filename="report.pdf"; charset=utf-8; __proto__=ignored'
);

console.log(parameters.filename); // report.pdf
console.log(parameters.charset); // utf-8
console.log(Object.getPrototypeOf(parameters)); // null
```
