# Security cards

Repository: `https://github.com/sequelize/sequelize#v6.37.8`
Category: escape hatch

## escape hatch

### Restrict Unsafe Raw Query Escape Hatches and Literals

**Use when**

Building queries using Sequelize low-level literal escape hatches or custom raw query expressions where untrusted user input might be passed.

**Secure rules**

**Rule 1: Avoid passing untrusted user input to Sequelize.literal()**

`Sequelize.literal` inserts arbitrary content into the query without any automatic escaping. It should not be used with user-generated content, as this may introduce major security vulnerabilities. Prefer Sequelize's structured query operators or parameterized queries (via `replacements` or `bind`) instead of concatenating untrusted input into raw expressions.

```javascript
await sequelize.query('SELECT * FROM users WHERE email = :email', {
  replacements: { email: userInput },
  type: QueryTypes.SELECT
});
```
