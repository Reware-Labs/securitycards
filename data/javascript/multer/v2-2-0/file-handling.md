# Security cards

Repository: `https://github.com/expressjs/multer#v2.2.0`
Category: file handling

## file handling

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
