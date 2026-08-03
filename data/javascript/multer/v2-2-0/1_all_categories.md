# Security cards

Repository: `https://github.com/expressjs/multer#v2.2.0`

## Category: api contract misuse

### Handle Multer Upload and Parsing Errors Correctly

**Use when**

When handling multipart file uploads in Express applications using Multer and implementing error-handling middleware or callback wrappers to capture size limits, filtering rejections, and parsing errors.

**Secure rules**

**Rule 1: Inspect and handle Multer error instances and upload failures explicitly in route callbacks or express error-handling middleware.**

Check upload errors against `multer.MulterError` or inspect error properties such as `err.code` inside express error middleware or route callbacks to distinguish size limit violations or invalid file types from server faults and return appropriate HTTP status codes.

```javascript
const multer = require('multer');
const upload = multer({ limits: { fileSize: 1000000 } }).single('avatar');

app.post('/profile', (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.code, field: err.field });
    } else if (err) {
      return next(err);
    }
    res.status(200).json({ message: 'Success' });
  });
});
```


## Category: boundary control

### Scope Multer Middleware to Specific Upload Routes

**Use when**

Configuring file upload endpoints where multer is integrated into routing.

**Secure rules**

**Rule 1: Never register multer instance methods globally using app.use() and instead scope middleware strictly to specific routes intended to process multipart uploads.**

Applying multer globally exposes non-upload routes to unexpected multipart form parsing and file uploads. Always mount multer middleware specifically on targeted route definitions rather than globally across the entire application, and explicitly configure limits such as `fieldNestingDepth`.

```javascript
const express = require('express')
const multer = require('multer')

const app = express()
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
    fields: 5,
    fieldNestingDepth: 3
  }
})

app.post('/profile/avatar', upload.single('avatar'), (req, res) => {
  res.status(200).send('Avatar uploaded')
})
```


## Category: escape hatch

### Avoid `upload.any` to restrict raw or unsafe multi-field uploads

**Use when**

Handling file upload endpoints where incoming multipart form data field boundaries and file counts must be strictly controlled.

**Secure rules**

**Rule 1: Restrict raw or unsafe multi-field file uploads by avoiding `upload.any` and using explicit field validation APIs instead.**

Avoid using `upload.any` on untrusted public routes because it bypasses per-field name checks and individual file count limits, allowing incoming files under any field name. Instead, use `upload.single`, `upload.array`, or `upload.fields` to maintain tight boundary controls.

```javascript
// Avoid:
// app.post('/upload', upload.any(), handler)

// Recommended:
app.post('/upload', upload.array('photos', 5), (req, res) => {
  res.send('Photos uploaded successfully')
})
```


## Category: file handling

### Configure isolated upload directories and random filenames for temporary disk storage

**Use when**

Configuring disk storage for file uploads in Multer to manage temporary files safely.

**Secure rules**

**Rule 1: Specify dedicated destination paths and unique random filenames for temporary disk storage.**

When configuring `multer.diskStorage`, explicitly define dedicated destination paths and ensure unique, unpredictable file naming using `crypto.randomBytes` or Multer's default extensionless random filenames to prevent temporary file exposure, path traversal, or naming collision issues.

```javascript
const path = require('path')
const crypto = require('crypto')
const multer = require('multer')

const storage = multer.diskStorage({
  destination: '/var/app/uploads/tmp',
  filename: function (req, file, cb) {
    const randomName = crypto.randomBytes(16).toString('hex')
    cb(null, randomName + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage })
```

**Rule 2: Configure isolated temporary upload directories and handle request aborts.**

When processing multipart uploads to disk using Multer, configure isolated destination directories and handle request aborts or malformed payloads so that partial temporary files do not persist on disk.

```js
const express = require('express');
const multer = require('multer');
const app = express();

const upload = multer({ dest: '/tmp/app-uploads' });

app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ success: true, file: req.file });
});

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || 'Upload failed' });
});
```


## Category: input contract definition

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


## Category: input interpretation safety

### Configure Default Parameter Charset to Ensure Safe Interpretation of Multipart Filenames

**Use when**

Handling multipart file upload requests containing non-ASCII filenames or parameters transmitted without RFC 5987 extended syntax.

**Secure rules**

**Rule 1: Explicitly configure defParamCharset to utf8 in Multer settings**

Set `defParamCharset: 'utf8'` in your Multer configuration so that non-extended multipart header parameters are consistently decoded as UTF-8 rather than defaulting to Latin-1, preventing mangled filenames and potential validation bypasses.

```javascript
const upload = multer({
  storage: multer.diskStorage({
    destination: '/tmp/uploads',
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'))
    }
  }),
  defParamCharset: 'utf8'
})
```


## Category: resource exhaustion

### Configure comprehensive resource limits when initializing Multer

**Use when**

Setting up Multer middleware to process multipart form data and file uploads in a Node.js application.

**Secure rules**

**Rule 1: Explicitly configure request size, field count, nesting depth, and file count limits in the limits configuration object.**

Prevent resource exhaustion attacks by specifying strict limits such as fileSize, fieldNestingDepth, fields, and files when initializing Multer. Without these limits, attackers can send malicious payloads that consume excessive server memory and CPU.

```javascript
const multer = require('multer')

const upload = multer({
  limits: {
    fieldNameSize: 100,
    fieldSize: 1024 * 1024,
    fileSize: 10 * 1024 * 1024,
    fields: 10,
    files: 2,
    parts: 15,
    fieldNestingDepth: 3
  }
})
```
