# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`
Category: resource exhaustion

## resource exhaustion

### Limit File Upload Sizes and Payload Limits to Prevent Resource Exhaustion

**Use when**

When accepting multipart file uploads and parsing JSON request bodies in a Feathers application.

**Secure rules**

**Rule 1: Configure explicit file size boundaries and express json payload limits**

Avoid buffering arbitrary-sized Base64 DataURIs in memory. Configure explicit file size limits using `multer` and set payload limits via `express.json` to protect against excessive RAM consumption and Denial of Service attacks.

```javascript
const multer = require('multer');
const multipartMiddleware = multer({
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(express.json({ limit: '1mb' }));
app.use('/uploads', multipartMiddleware.single('uri'), blobService({ Model: blobStorage }));
```

**Rule 2: Enforce pagination limits in application configuration**

Configure both default and maximum pagination settings under the `paginate` key in application configuration to prevent API consumers from requesting unbounded result sets that can overload database services and lead to memory exhaustion.

```json
{
  "paginate": {
    "default": 10,
    "max": 100
  }
}
```
