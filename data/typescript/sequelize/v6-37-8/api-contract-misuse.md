# Security cards

Repository: `https://github.com/sequelize/sequelize#v6.37.8`
Category: api contract misuse

## api contract misuse

### Maintain Correct Lifecycle and Transaction Handling Boundaries

**Use when**

When managing database transactions and ensuring transaction handles or query methods are invoked within valid lifecycle boundaries.

**Secure rules**

**Rule 1: Do not attempt to execute queries using a Transaction handle after commit or rollback has been called.**

Sequelize explicitly invalidates finished transaction objects and rejects subsequent query attempts with an error attached to the rejected SQL statement. Prefer using managed transactions via `sequelize.transaction()` where Sequelize automatically handles lifecycle completion.

```javascript
await sequelize.transaction(async (t) => {
  const user = await User.create({ name: 'Alice' }, { transaction: t });
  await Profile.create({ userId: user.id }, { transaction: t });
});
```


### Properly Format and Supply Parameters for Queries and Model Methods

**Use when**

When constructing raw queries, model lookups, and creation methods requiring precise argument types, parameter maps, and attribute projections.

**Secure rules**

**Rule 1: Provide complete, defined replacement parameters and avoid mixing parameter mechanisms in raw queries.**

Ensure every replacement token defined in raw SQL strings corresponds to a defined value in the replacements map or array, and do not mix `replacements` and `bind` options in `sequelize.query()` calls.

```javascript
const users = await sequelize.query(
  'SELECT * FROM users WHERE username = :username AND email_address = :email',
  {
    replacements: {
      username: 'john',
      email: 'john@gmail.com'
    },
    type: Sequelize.QueryTypes.SELECT
  }
);
```

**Rule 2: Validate user-controlled attribute selection parameters before passing them to the attributes option.**

Aliased attribute projections must be formatted strictly as two-element arrays `['column', 'alias']`. Passing single-element array pairs throws an unhandled error during query construction.

```javascript
function sanitizeAttributes(userAttributes) {
  return userAttributes.filter(attr => {
    if (typeof attr === 'string') return true;
    if (Array.isArray(attr) && attr.length === 2) return true;
    return false;
  });
}

const user = await User.findOne({
  where: { id: req.params.id },
  attributes: sanitizeAttributes(req.query.attributes)
});
```
