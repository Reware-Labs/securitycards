# Security cards

Repository: `https://github.com/sequelize/sequelize#v6.37.8`
Category: configuration source integrity

## configuration source integrity

### Prevent Connection URL Parameter Overrides by Using Explicit Configuration Options

**Use when**

Instantiating Sequelize with database connection parameters where connection string parsing might allow untrusted input to override security settings.

**Secure rules**

**Rule 1: Pass database configuration via structured explicit options objects rather than unvalidated connection strings.**

When instantiating Sequelize, avoid constructing database connection URLs from untrusted user input because query string parameters are automatically parsed and merged into configuration options. Use structured explicit options objects and static environment variables to prevent attackers from overriding host targets, SSL settings, or driver behaviors.

```javascript
const sequelize = new Sequelize('dbname', 'user', 'password', {
  host: process.env.DB_HOST,
  port: 3306,
  dialect: 'mysql',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: true
    }
  }
});
```
