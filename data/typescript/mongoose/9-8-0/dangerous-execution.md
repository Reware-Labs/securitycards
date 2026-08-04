# Security cards

Repository: `https://github.com/automattic/mongoose#9.8.0`
Category: dangerous execution

## dangerous execution

### Restrict Update Pipeline Usage

**Use when**

When performing update queries in Mongoose where untrusted input might otherwise be passed to `updatePipeline`.

**Secure rules**

**Rule 1: Keep updatePipeline set to false or strictly validate and sanitize all pipeline stages before passing them to update methods.**

Avoid enabling updatePipeline: true when executing update queries with untrusted input because Mongoose explicitly disables update pipelines by default and update pipeline operations are not schema-cast.

```typescript
await Model.updateOne({ _id: id }, [{ $set: { status: sanitizedStatus } }], { updatePipeline: true });
```
