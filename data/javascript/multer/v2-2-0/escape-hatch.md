# Security cards

Repository: `https://github.com/expressjs/multer#v2.2.0`
Category: escape hatch

## escape hatch

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
