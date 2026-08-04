# Security blueprint

Repository: `https://github.com/expressjs/multer#v2.2.0`

## Security posture

When developing applications utilizing multer, engineers must assume that multipart form-data parsing, file uploads, and temporary storage management are inherently security-sensitive and require strict boundary controls. The library does not enforce global file size limits, specific destination paths, or upload restrictions by default, meaning developers must explicitly configure resource quotas and route scopes. Mistakes involving unconstrained uploads or missing error handling must fail closed by rejecting malicious payloads and preventing unauthorized resource consumption.

## Essential implementation rules

1. **Explicitly Handle Multer Error Instances**

Inspect and handle Multer error instances and upload failures explicitly in route callbacks or express error-handling middleware by checking against `multer.MulterError` or `err.code` to return appropriate HTTP status codes.

2. **Scope Multer Middleware to Specific Routes**

Never register multer instance methods globally using `app.use()`, and instead scope middleware strictly to specific routes intended to process multipart uploads with explicit configuration limits.

3. **Restrict Unsafe Multi-Field Uploads**

Avoid using `upload.any()` on untrusted public routes because it bypasses per-field name checks and individual file count limits; use explicit field validation APIs like `upload.single`, `upload.array`, or `upload.fields`.

4. **Configure Isolated Upload Directories and Random Filenames**

When configuring `multer.diskStorage`, explicitly define dedicated destination paths and ensure unique, unpredictable file naming using `crypto.randomBytes` or Multer's default extensionless random filenames to prevent path traversal and naming collisions.

5. **Enforce Strict Input Contracts and Limits on Form Fields and Files**

Define explicit upload contracts using `upload.single()`, `upload.array()`, or `upload.fields()` to restrict accepted form field names and cap file counts, rejecting unexpected files or fields.

6. **Reject Unexpected File Uploads on Text-Only Endpoints**

Use `multer().none()` on routes that accept multipart/form-data but should strictly reject file uploads, handling `LIMIT_UNEXPECTED_FILE` error codes appropriately.

7. **Configure Default Parameter Charset to UTF-8**

Explicitly set `defParamCharset: 'utf8'` in your Multer configuration so that non-extended multipart header parameters are consistently decoded as UTF-8 rather than Latin-1.

8. **Configure Comprehensive Resource Limits**

Prevent resource exhaustion attacks by explicitly specifying strict limits such as `fileSize`, `fieldNestingDepth`, `fields`, and `files` when initializing Multer.
