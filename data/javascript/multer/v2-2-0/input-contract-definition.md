# Security cards

Repository: `https://github.com/expressjs/multer#v2.2.0`
Category: input contract definition

## input contract definition

### Enforce strict input contracts and limits on form fields and files

**Use when**

When defining endpoints that handle multipart form submissions and file uploads to reject unexpected fields, excess files, and unauthorized file uploads.

**Secure rules**

**Rule 1: Enforce explicit upload contracts and limits using multer configuration options to reject unexpected files and fields.**

Define explicit upload contracts using `upload.single()`, `upload.array(name, maxCount)`, or `upload.fields([{ name, maxCount }])` to restrict accepted form field names and cap file counts per field. Multer automatically rejects unexpected file fields or excess files with a `LIMIT_UNEXPECTED_FILE` error code.

```javascript
const express = require('express')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const app = express()

app.post('/profile', upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'documents', maxCount: 3 }
]), (req, res) => {
  res.send('Files uploaded successfully')
})

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected field or file count limit exceeded' })
  }
  next(err)
})
```

**Rule 2: Reject unexpected file uploads on text-only endpoints using upload.none.**

Use `multer().none()` on routes that accept multipart/form-data but should strictly reject file uploads. Multer enforces this restriction by rejecting any incoming files with a `LIMIT_UNEXPECTED_FILE` error code while safely parsing text fields into `req.body`.

```javascript
Configure text-only multipart routes with `upload.none()` and ensure proper error handling for `LIMIT_UNEXPECTED_FILE` errors:

const express = require('express');
const multer = require('multer');

const upload = multer({
  limits: {
    fieldNestingDepth: 3
  }
});

const app = express();

app.post('/submit-text', upload.none(), (req, res, next) => {
  // req.body contains text fields
  res.json({ status: 'ok', body: req.body });
});

app.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'File uploads are not allowed on this endpoint' });
  }
  next(err);
});
```
