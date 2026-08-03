# Security cards

Repository: `https://github.com/sequelize/sequelize#v6.37.8`
Category: security control integrity

## security control integrity

### Ensure Model Validations and Lifecycle Hooks Run During Data Mutations

**Use when**

When performing bulk inserts, upserts, validations, or soft deletes on Sequelize models where lifecycle hooks and model validation checks could otherwise be bypassed.

**Secure rules**

**Rule 1: Explicitly enable validation on bulk create operations.**

Pass `{ validate: true }` when calling `Model.bulkCreate()` to ensure that model-defined validation rules are executed on untrusted input.

```javascript
await Task.bulkCreate(inputData, {
  validate: true,
  fields: ['name', 'code']
});
```

**Rule 2: Retain default validation on model upserts.**

Do not pass `{ validate: false }` when processing untrusted input in `Model.upsert()` to prevent bypassing application validation rules.

```javascript
try {
  await User.upsert({
    id: req.body.id,
    email: req.body.email
  });
} catch (error) {
  if (error instanceof Sequelize.ValidationError) {
    // Handle validation error
  }
}
```

**Rule 3: Attach deletion audit logic to destroy hooks for paranoid models.**

Implement audit logging and state validation within `beforeDestroy` and `afterDestroy` hooks rather than save hooks when working with paranoid models, as soft deletes do not trigger save lifecycle hooks.

```javascript
const User = sequelize.define('User', {
  username: Sequelize.STRING
}, {
  paranoid: true,
  hooks: {
    beforeDestroy: (instance, options) => {
      auditLog.record('USER_SOFT_DELETE', instance.id);
    }
  }
});

await user.destroy();
```
