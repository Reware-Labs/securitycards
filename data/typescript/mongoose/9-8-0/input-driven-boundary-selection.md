# Security cards

Repository: `https://github.com/automattic/mongoose#9.8.0`
Category: input driven boundary selection

## input driven boundary selection

### Constrain Dynamic Model Lookups with Schema Enums

**Use when**

When defining schemas that use dynamic document references via `refPath` to populate documents from untrusted sources.

**Secure rules**

**Rule 1: Whitelisted allowed target models using schema enum validation on the discriminator path.**

When using dynamic document references via `refPath`, always constrain the discriminator field in the schema using an `enum` validator to prevent attackers from querying or populating arbitrary models within the application.

```javascript
const commentSchema = new Schema({
  body: { type: String, required: true },
  doc: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'docModel'
  },
  docModel: {
    type: String,
    required: true,
    enum: ['BlogPost', 'Product']
  }
});
```
