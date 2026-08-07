# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`
Category: file handling

## file handling

### Validate uploaded files in Feathers service hooks

**Use when**

Handling file uploads through Express middleware and Feathers services where uploaded file attributes must be validated.

**Secure rules**

**Rule 1: Validate uploaded file attributes and MIME types inside service hooks before processing storage operations.**

Map incoming files to `context.params.file` using Express middleware and implement a `before` hook on the uploads service to verify file properties such as `mimetype` against an explicit allowlist.

```typescript
app.use('/uploads',
  multipartMiddleware.single('uri'),
  (req, res, next) => {
    req.feathers.file = req.file;
    next();
  },
  blobService({ Model: blobStorage })
);

app.service('uploads').hooks({
  before: {
    create: [
      async (context) => {
        const file = context.params.file;
        if (!file || !['image/png', 'image/jpeg'].includes(file.mimetype)) {
          throw new Error('Invalid file type');
        }
      }
    ]
  }
});
```
