# Security cards

Repository: `https://github.com/expressjs/multer#v2.2.0`
Category: api contract misuse

## api contract misuse

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
