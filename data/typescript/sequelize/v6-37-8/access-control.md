# Security cards

Repository: `https://github.com/sequelize/sequelize#v6.37.8`
Category: access control

## access control

### Enforce Tenant Isolation and Access Control on Join Table Attributes in Many-to-Many Queries

**Use when**

Querying associated records across `belongsToMany` relationships where tenant isolation or ownership checks must be applied to the intermediate join table metadata.

**Secure rules**

**Rule 1: Fetch rotating database credentials with `beforeConnect`**

Use Sequelize’s `beforeConnect` hook when a database password must be obtained asynchronously from a rotating token store. Assign the retrieved credential to `config.password` before Sequelize creates the connection.
