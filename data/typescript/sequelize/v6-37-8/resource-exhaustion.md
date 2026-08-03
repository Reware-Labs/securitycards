# Security cards

Repository: `https://github.com/sequelize/sequelize#v6.37.8`
Category: resource exhaustion

## resource exhaustion

### Configure maxRows in dialectOptions to prevent memory exhaustion

**Use when**

Configuring database connections and handling large query results in Sequelize to prevent memory exhaustion and Denial of Service.

**Secure rules**

**Rule 1: Configure dialectOptions.maxRows to cap the row limit returned by queries.**

When setting up database connections, explicitly define `dialectOptions.maxRows` to limit excessive row counts and prevent Node.js heap exhaustion caused by unconstrained query results.

```javascript
const sequelize = new Sequelize('database', 'username', 'password', {
  dialect: 'oracle',
  host: 'localhost',
  dialectOptions: {
    maxRows: 5000
  }
});
```
