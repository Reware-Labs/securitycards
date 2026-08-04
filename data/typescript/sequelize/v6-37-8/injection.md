# Security cards

Repository: `https://github.com/sequelize/sequelize#v6.37.8`
Category: injection

## injection

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
