# Security cards

Repository: `https://github.com/expressjs/multer#v2.2.0`
Category: boundary control

## boundary control

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
