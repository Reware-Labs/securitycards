# Security cards

Repository: `https://github.com/sequelize/sequelize#v6.37.8`
Category: runtime environment hardening

## runtime environment hardening

### Disable Forceful and Destructive Schema Synchronization in Production Environments

**Use when**

Configuring application initialization and database connection logic for deployment environments.

**Secure rules**

**Rule 1: Avoid using sync with force or alter options in production environments.**

Ensure that `sync({ force: true })` and `sync({ alter: true })` are never invoked in production to prevent unintended data destruction, table drops, or column alterations. Instead, run managed database migrations or restrict synchronization checks using environment conditions.

```javascript
if (process.env.NODE_ENV === 'production') {
  await sequelize.authenticate();
} else {
  await sequelize.sync({ match: /_test$/ });
}
```
