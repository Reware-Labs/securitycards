# Security cards

Repository: `https://github.com/automattic/mongoose#9.8.0`
Category: access control

## access control

### Enforce Tenant Isolation and Authorization Filters in Save Hooks

**Use when**

When saving documents in Mongoose where updating existing records could bypass tenant ownership or authorization boundaries.

**Secure rules**

**Rule 1: Set document-level query filters inside pre-save middleware hooks to enforce tenant isolation and ownership rules.**

When updating existing documents where `$isNew` is false, assign additional filter conditions such as `tenantId` and `isDeleted` checks to `this.$where` inside a `pre('save')` hook to prevent unauthorized cross-tenant modifications.

```javascript
userSchema.pre('save', function() {
  if (!this.isNew) {
    this.$where = { tenantId: this.$locals.tenantId, isDeleted: false };
  }
});
```
