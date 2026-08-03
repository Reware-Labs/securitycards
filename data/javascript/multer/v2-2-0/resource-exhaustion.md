# Security cards

Repository: `https://github.com/expressjs/multer#v2.2.0`
Category: resource exhaustion

## resource exhaustion

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
