# Security cards

Repository: `https://github.com/sequelize/sequelize#v6.37.8`
Category: secret handling

## secret handling

### Load Database Credentials Securely and Exclude Sensitive Attributes

**Use when**

Configuring database connection credentials and defining model attributes in Sequelize applications.

**Secure rules**

**Rule 1: Fetch rotating database credentials with `beforeConnect`**

Use Sequelize’s `beforeConnect` hook when a database password must be obtained asynchronously from a rotating token store. Assign the retrieved credential to `config.password` before Sequelize creates the connection.

**Rule 2: Exclude sensitive attributes from models using scopes and virtual data types to prevent secret leakage.**

Define model default scopes to exclude confidential database attributes like secret tokens or hashes. Use `DataTypes.VIRTUAL` attributes when handling raw secrets to ensure they are never stored directly in database columns.

```javascript
const Child = sequelize.define('Child', {
  secret: Sequelize.STRING
}, {
  defaultScope: {
    attributes: {
      exclude: ['secret']
    }
  }
});
```
