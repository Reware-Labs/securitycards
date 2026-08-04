# Security cards

Repository: `https://github.com/sequelize/sequelize#v6.37.8`
Category: input contract definition

## input contract definition

### Enforce Strict Input Contracts and Type Validation in Sequelize Models

**Use when**

Defining Sequelize models, data types, associations, and instance options where untrusted input must conform to strict schema boundaries before execution.

**Secure rules**

**Rule 1: Define strict data types and constraints on model attributes to reject invalid inputs.**

Use strictly constrained data types such as `DataTypes.ENUM`, `DataTypes.UUID`, or explicit length-bound `STRING`s for model fields to enforce schema-level input boundaries. Sequelize data types like `ENUM` validate incoming inputs against predefined allowed values prior to query execution. Additionally, define explicit column constraints such as `allowNull: false` and custom attribute `validate` methods in Sequelize model definitions.

```javascript
const User = sequelize.define('User', {
  role: {
    type: DataTypes.ENUM('admin', 'user', 'guest'),
    allowNull: false,
    defaultValue: 'user'
  }
});
```

**Rule 2: Enable typeValidation on the Sequelize instance to enforce strict attribute typing.**

Enable `typeValidation: true` on the Sequelize instance options to enforce attribute data type checking prior to model operations such as create and update. Relying solely on database engine type coercion can lead to unexpected type conversions or bypasses in application-level input contract checks.

```javascript
const sequelize = new Sequelize('database', 'user', 'pass', {
  host: 'localhost',
  dialect: 'postgres',
  typeValidation: true
});
```

**Rule 3: Validate UUID inputs strictly without disabling format checks.**

When validating inputs using Sequelize UUID data types such as `DataTypes.UUID` or `DataTypes.UUIDV4`, avoid passing `{ acceptStrings: true }` to the `validate` method. Sequelize strictly verifies UUID structure and version specs by default.

```javascript
const { DataTypes } = require('sequelize');
const uuidv4Type = DataTypes.UUIDV4();

try {
  uuidv4Type.validate(userInput);
} catch (err) {

}
```

**Rule 4: Validate and sanitize query parameters to prevent undefined values in where clauses.**

Avoid passing `undefined` variables inside `where` condition objects when performing database operations. Sequelize strictly validates `where` parameters and throws an error when encountering `undefined`. Developers must validate and sanitize request parameters before passing them into query options.

```javascript
const where = {};
if (typeof req.query.name === 'string') {
  where.name = req.query.name;
}

await User.destroy({ where });
```

**Rule 5: Explicitly define through models for associations to enforce attribute validation rules.**

When creating a `belongsToMany` association using a string for the `through` option, Sequelize automatically defines a lightweight model with empty validation rules. To enforce validation rules on join table attributes, define the through table explicitly as a model with validation constraints.

```javascript
const UserProject = sequelize.define('UserProject', {
  role: {
    type: Sequelize.STRING,
    validate: {
      isIn: [['admin', 'member', 'viewer']]
    }
  }
});

User.belongsToMany(Project, { through: UserProject });
Project.belongsToMany(User, { through: UserProject });
```
