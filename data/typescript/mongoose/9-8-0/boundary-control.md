# Security cards

Repository: `https://github.com/automattic/mongoose#9.8.0`
Category: boundary control

## boundary control

### Specify Target Scope for Deletion Middleware Boundary Checks

**Use when**

Implementing deletion middleware or security hooks to ensure boundary checks execute correctly across document and query operations.

**Secure rules**

**Rule 1: Explicitly configure hook targets for both query and document execution contexts when security checks are required for delete operations.**

Mongoose distinguishes document middleware from query middleware. Hooks intended for deletion boundary checks or cascading security cleanups must explicitly specify their target scope to avoid bypassed authorization checks during static model query deletions.

```javascript
const schema = new Schema({ name: String });

schema.pre('deleteOne', { query: true, document: true }, function() {
  if (this instanceof mongoose.Query) {
    // Handle query-level deletion security logic
  } else {
    // Handle document instance deletion security logic
  }
});
```
