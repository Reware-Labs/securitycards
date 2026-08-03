# Security cards

Repository: `https://github.com/koajs/koa#v3.2.1`
Category: file handling

## file handling

### Use `response.attachment()` for Safe File Downloads

**Use when**

Serving downloadable files and attachments to clients while preventing MIME-sniffing vulnerabilities.

**Secure rules**

**Rule 1: Call `ctx.attachment()` when returning file streams to enforce proper `Content-Disposition` headers.**

Use `ctx.response.attachment([filename])` or `ctx.attachment([filename])` when serving downloadable content to ensure correct `Content-Disposition` header formatting and prevent client browser MIME-sniffing vulnerabilities.

```javascript
app.use(async ctx => {
  ctx.attachment('report.pdf');
  ctx.body = fs.createReadStream('/path/to/report.pdf');
});
```


### Use ctx.attachment and set explicit Content-Type when serving static files

**Use when**

Serving static files or file attachments to users through Koa while ensuring secure Content-Disposition and MIME-type handling.

**Secure rules**

**Rule 1: Call ctx.attachment to configure safe Content-Disposition headers and prevent content-sniffing risks.**

When serving static files intended for download, call `ctx.attachment(filename)` to automatically handle `Content-Disposition` generation. To prevent browsers from executing potentially dangerous files inline, set an explicit `Content-Type` such as `application/octet-stream` before invoking `ctx.attachment()`.

```js
const fs = require('node:fs');

app.use(async (ctx) => {
  ctx.response.set('Content-Type', 'application/octet-stream');
  ctx.attachment('report.pdf');
  ctx.body = fs.createReadStream('/var/storage/report.pdf');
});
```
