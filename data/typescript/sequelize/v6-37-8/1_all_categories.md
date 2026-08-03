# Security cards

Repository: `https://github.com/sequelize/sequelize#v6.37.8`

## Category: access control

### Enforce Tenant Isolation and Access Control on Join Table Attributes in Many-to-Many Queries

**Use when**

Querying associated records across `belongsToMany` relationships where tenant isolation or ownership checks must be applied to the intermediate join table metadata.

**Secure rules**

**Rule 1: Fetch rotating database credentials with `beforeConnect`**

Use Sequelize’s `beforeConnect` hook when a database password must be obtained asynchronously from a rotating token store. Assign the retrieved credential to `config.password` before Sequelize creates the connection.


## Category: api contract misuse

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


## Category: boundary control

### Validate Post-Commit Callback Handlers Pass Callable Functions

**Use when**

Registering post-commit callbacks on transaction instances using Sequelize

**Secure rules**

**Rule 1: Verify that post-commit callback handlers are functions before registering them on a transaction.**

Always check that post-commit hook arguments are functions before registering them on the transaction instance using `t.afterCommit(fn)` to prevent runtime errors.

```javascript
await sequelize.transaction(async (t) => {
  await User.update({ status: 'active' }, { where: { id: userId }, transaction: t });
  if (typeof onCommitCallback === 'function') {
    t.afterCommit(onCommitCallback);
  }
});
```


## Category: configuration source integrity

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


## Category: escape hatch

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


## Category: injection

### Secure JSON Path Queries and Dialect Identifiers with Structured Helpers and Allowlist Validation

**Use when**

When querying JSON columns, filtering paths, or executing DDL and metadata operations involving dynamic table or column identifiers.

**Secure rules**

**Rule 1: Use Sequelize.json() or structured object/dot-notation queries for JSON property filtering**

When filtering on JSON columns or nested JSON path properties in model methods such as findOne or findAll, use the Sequelize.json helper (string path with optional value, or object form) or structured where objects with nested keys or dot notation. These construct dialect-specific JSON extraction and comparison clauses with identifier quoting and path-element escaping.

```javascript
const user = await User.findOne({
  where: Sequelize.json('emergency_contact.value', userInput)
});
```


### Use Parameterized Queries and Structured Where Objects for Secure Data Retrieval

**Use when**

When building database queries, executing raw statements, or performing deletion operations with Sequelize models to prevent injection attacks.

**Secure rules**

**Rule 1: Pass untrusted user inputs directly as values within structured where objects.**

Always rely on object-based `where` filter criteria when calling Sequelize querying or deletion functions. Sequelize automatically escapes quotes and control characters in string criteria passed through standard `where` objects across all supported database dialects.

```javascript
const project = await Project.findOne({
  where: {
    name: req.body.projectName
  }
});
```

**Rule 2: Always pass untrusted user inputs into raw SQL via the replacements or bind options.**

When executing raw queries with positional or named placeholders, rely on Sequelize's replacement or bind engines rather than manually formatting or concatenating SQL strings. Sequelize safely parses replacements outside of string literals and validates query string syntax.

```javascript
const [users] = await sequelize.query(
  'SELECT * FROM users WHERE status = :status AND id = :id',
  {
    replacements: { status: 'active', id: req.params.id },
    type: QueryTypes.SELECT
  }
);
```


## Category: input contract definition

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


## Category: input interpretation safety

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


## Category: resource exhaustion

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


## Category: runtime environment hardening

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


## Category: secret handling

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


## Category: security control integrity

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
