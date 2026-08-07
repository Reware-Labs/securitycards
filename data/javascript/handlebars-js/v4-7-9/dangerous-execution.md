# Security cards

Repository: `https://github.com/handlebars-lang/handlebars.js#v4.7.9`
Category: dangerous execution

## dangerous execution

### Use precompiled partials in runtime-only Handlebars environments

**Use when**

Building and running applications using the standalone Handlebars runtime environment where dynamic template compilation is restricted.

**Secure rules**

**Rule 1: Precompile templates and partials for runtime-only builds**

The lightweight `handlebars/runtime` bundle does **not** include the compiler. Any attempt to render a string template or partial triggers an error, so compile every template and partial during your build step (e.g., with the `handlebars` CLI) and register the resulting functions before rendering.

```javascript
import Handlebars from 'handlebars/runtime';

// functions generated at build time by `handlebars --precompile`
import mainTpl from './templates/main.hbs.js';
import headerPartial from './templates/header.hbs.js';

// make the precompiled partial available
Handlebars.registerPartial('header', headerPartial);

// render safely at runtime-only
console.log(mainTpl({ title: 'Hello Handlebars' }));
```
