# Security cards

Repository: `https://github.com/sequelize/sequelize#v6.37.8`
Category: input interpretation safety

## input interpretation safety

### Supply Plain Objects with Own Properties for Named SQL Replacements

**Use when**

When supplying replacement maps for named parameters in raw SQL queries to ensure keys resolve strictly to own properties.

**Secure rules**

**Rule 1: Ensure that replacement maps for named parameters are plain objects containing only own properties.**

Verify that replacement keys are own properties of the replacement object. Object prototype properties must not be resolved as values to prevent unintended resolution of inherited Object methods.

```javascript
const replacements = Object.assign(Object.create(null), {
  id: req.query.id
});

await sequelize.query('SELECT * FROM users WHERE id = :id', {
  replacements,
  type: QueryTypes.SELECT
});
```
