# Security cards

Repository: `https://github.com/expressjs/multer#v2.2.0`
Category: input interpretation safety

## input interpretation safety

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
