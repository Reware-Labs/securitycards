# Security cards

Repository: `https://github.com/typeorm/typeorm#1.1.0`

## Category: access control

### Restrict database connections to read-only mode for query-only operations

**Use when**

Configuring database connections in applications where write access is not required or should be restricted to enforce tenant isolation and least privilege access.

**Secure rules**

**Rule 1: Open better-sqlite3 connections in read-only mode when writes are not required**

For a `better-sqlite3` data source that should not perform writes, set `readonly: true`. This supported driver option opens the database connection in read-only mode.

```typescript
import { DataSource } from "typeorm"

export const AppDataSource = new DataSource({
    type: "better-sqlite3",
    database: "mydb.sqlite",
    readonly: true,
})
```


## Category: api contract misuse

### Adhere to TypeORM API contracts and argument constraints

**Use when**

Calling TypeORM repository, entity manager, query builder, and transaction methods where specific arguments, types, call orders, criteria objects, and lock options are required.

**Secure rules**

**Rule 1: Provide numeric arguments to QueryBuilder limit methods**

Ensure arguments passed to QueryBuilder limit methods are strictly numeric values. TypeORM validates limit arguments in `UpdateQueryBuilder` and `SoftDeleteQueryBuilder` and throws an error when non-numeric inputs are supplied.

```typescript
const safeLimit = Number.isInteger(Number(req.query.limit)) ? Math.max(1, Number(req.query.limit)) : 10;
await dataSource
  .createQueryBuilder()
  .update(Post)
  .set({ text: "updated" })
  .where("id = :id", { id: postId })
  .limit(safeLimit)
  .execute();
```

**Rule 2: Pass plain object criteria when relying on invalidWhereValuesBehavior**

Ensure criteria passed to repository find, update, delete, softDelete, or restore methods are plain `FindOptionsWhere` objects when depending on `invalidWhereValuesBehavior` runtime validation. Passing entity class instances directly circumvents this behavior normalization, allowing null property values on the entity instance to pass through unvalidated into queries.

```typescript
import { IsNull } from "typeorm"

await repository.delete({
    text: IsNull(),
})
```

**Rule 3: Ensure unique parameter names across QueryBuilder expressions**

Assign unique parameter keys across all expressions within a single QueryBuilder chain rather than reusing generic placeholder names like `:id` multiple times to prevent parameter overriding and unexpected data access.

```typescript
const result = await dataSource
    .getRepository(User)
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.linkedSheep", "linkedSheep")
    .leftJoinAndSelect("user.linkedCow", "linkedCow")
    .where("user.linkedSheep = :sheepId", { sheepId })
    .andWhere("user.linkedCow = :cowId", { cowId })
    .getOne();
```

**Rule 4: Ensure entity instances have primary keys populated before soft deletion**

When target entity instances are passed to `.whereEntity(entity)`, verify that all primary key fields are set. `SoftDeleteQueryBuilder` enforces runtime checks via `getEntityIdMap()` and throws an error if primary key values are missing.

```typescript
const user = await userRepository.findOneBy({ id: userId });
if (user && user.id) {
    await dataSource
        .createQueryBuilder()
        .softDelete()
        .from(User)
        .whereEntity(user)
        .execute();
}
```

**Rule 5: Execute pessimistic query builder locks inside database transactions**

When executing queries with pessimistic locks using `QueryBuilder.setLock()`, TypeORM requires an active database transaction. Always execute locked queries using the transactional EntityManager inside `dataSource.manager.transaction()`.

```typescript
await dataSource.manager.transaction(async (transactionalEntityManager) => {
    const post = await transactionalEntityManager
        .createQueryBuilder(PostWithVersion, "post")
        .setLock("pessimistic_write")
        .where("post.id = :id", { id: 1 })
        .getOne()
})
```

**Rule 6: Restrict optimistic locking queries to single entity lookups**

Optimistic locking specified via `QueryBuilder.setLock("optimistic", version)` is supported exclusively for single-entity retrievals using `getOne()`. Calling aggregate fetch methods with an optimistic lock throws an `OptimisticLockCanNotBeUsedError`.

```typescript
const post = await dataSource
    .createQueryBuilder(PostWithVersion, "post")
    .setLock("optimistic", expectedVersion)
    .where("post.id = :id", { id: 1 })
    .getOne()
```

**Rule 7: Avoid bidirectional cascade remove configuration on entity relations**

Do not configure bidirectional cascade removal on both sides of an entity relationship. TypeORM metadata validation rejects models where both sides of a relation enable cascade removal.

```typescript
@Entity()
export class ParentEntity {
    @OneToMany(() => ChildEntity, (child) => child.parent, { cascade: ["remove"] })
    children: ChildEntity[];
}

@Entity()
export class ChildEntity {
    @ManyToOne(() => ParentEntity, (parent) => parent.children)
    parent: ParentEntity;
}
```

**Rule 8: Always use the provided transactional entity manager within transactions**

When executing database operations inside a transaction callback via `DataSource.transaction()` or `DataSource.manager.transaction()`, always use the transactional entity manager passed as the callback argument rather than any global, outer, or repository entity manager.

```typescript
await myDataSource.manager.transaction(async (transactionalEntityManager) => {
    await transactionalEntityManager.save(users)
    await transactionalEntityManager.save(photos)
})
```

**Rule 9: Specify valid transaction isolation levels to prevent concurrency anomalies**

Explicitly supply driver-supported transaction isolation levels when starting transactions using `dataSource.manager.transaction(isolationLevel, runInTransaction)` to ensure database prerequisites are met and avoid cross-session isolation leakages.

```typescript
await dataSource.manager.transaction("SERIALIZABLE", async (transactionalEntityManager) => {
  const post = new Post();
  post.title = "Secure Transaction Post";
  await transactionalEntityManager.save(post);
});
```


## Category: authentication

### Configure Database Authentication and Identity Mechanisms Safely

**Use when**

Configuring database connections and authentication options in TypeORM for enterprise or cloud-hosted environments.

**Secure rules**

**Rule 1: Use Azure AD authentication for SQL Server connections instead of static passwords**

When `type: "mssql"` and the database is protected by Azure Active Directory, omit the `username` / `password` fields and supply the `authentication` option with one of the built-in Azure AD mechanisms (e.g. managed-identity for App Service, VM, or an access-token). This avoids embedding long-lived secrets in configuration.

```typescript
import { DataSource } from "typeorm"

export const AppDataSource = new DataSource({
    type: "mssql",
    host: "my-sqlserver.database.windows.net",
    database: "my_database",
    authentication: {
        type: "azure-active-directory-msi-app-service", // managed identity
    },
})
```

**Rule 2: Disable insecure legacy authentication options for MySQL connections.**

Ensure `insecureAuth` remains set to `false` when connecting to MySQL instances to prevent fallback to weak or outdated authentication protocols.

```typescript
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "app_user",
    password: "db_password",
    database: "my_database",
    insecureAuth: false,
});
```

**Rule 3: Fetch and pass dynamically acquired access tokens to Azure AD SQL authentication.**

Retrieve access tokens dynamically at runtime from secure token providers rather than hardcoding static token strings in application code or configuration files.

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { DataSource } from "typeorm";

const credential = new DefaultAzureCredential();
const accessToken = await credential.getToken("https://database.windows.net/.default");

const AppDataSource = new DataSource({
    type: "mssql",
    host: "your-db-server.database.windows.net",
    database: "your-db",
    authentication: {
        type: "azure-active-directory-access-token",
        options: {
            token: accessToken.token
        }
    }
});
```


## Category: boundary control

### Route Security-Critical Read Queries to Master Node

**Use when**

When performing queries that evaluate access control checks or rely on recently written state in a replicated database environment.

**Secure rules**

**Rule 1: Explicitly route security-critical read queries to the master node to prevent evaluation against stale slave data.**

When using database replication, TypeORM routes read queries to random slave nodes by default. For queries that perform access control checks or rely on recently written state, instantiate a query runner targeting the master explicitly or configure the default mode to master to ensure trust transition checks evaluate against up-to-date state.

```typescript
const masterQueryRunner = dataSource.createQueryRunner("master");
try {
    const user = await dataSource
        .createQueryBuilder(User, "user", masterQueryRunner)
        .where("user.id = :id", { id: userId })
        .getOne();
} finally {
    await masterQueryRunner.release();
}
```


## Category: configuration source integrity

### Configure Explicit DataSource Settings and Avoid Unsafe Synchronization Defaults

**Use when**

Initializing TypeORM DataSource configurations for production and development environments.

**Secure rules**

**Rule 1: Ensure automatic schema synchronization is disabled in production environments.**

Set `synchronize: false` in production environments when initializing `DataSource` to prevent unintended database table drops or column alterations. Rely on managed database migrations instead of automatic schema synchronization.

```typescript
import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entities/User"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: process.env.NODE_ENV !== "production",
    logging: false,
    entities: [User],
    migrations: [],
    subscribers: [],
})
```


## Category: dangerous execution

### Disable Function Serialization in MongoDB DataSource Configuration

**Use when**

Configuring MongoDB database connections using `DataSource` in TypeORM.

**Secure rules**

**Rule 1: Ensure `serializeFunctions` remains false in MongoDB `DataSource` options to prevent serializing JavaScript functions into BSON documents.**

Set `serializeFunctions` explicitly to `false` in your MongoDB `DataSource` configuration to prevent functions attached to objects from being encoded into BSON and stored in the database, thereby avoiding subsequent remote code execution or function injection risks.

```typescript
import { DataSource } from "typeorm"

export const AppDataSource = new DataSource({
    type: "mongodb",
    host: "localhost",
    port: 27017,
    database: "test",
    serializeFunctions: false,
})
```


## Category: injection

### Avoid Passing Function Callbacks as Query Parameter Values

**Use when**

When configuring parameter maps or object literals for database query execution across TypeORM drivers.

**Secure rules**

**Rule 1: Never pass function callbacks or user-influenced functions as parameter values in query parameter maps.**

Several database drivers execute parameter values defined as functions and concatenate their string returns directly into the SQL statement without parameterization or escaping. Always supply primitive scalar values, dates, or arrays directly in query parameter maps.

```typescript
const result = await queryRunner.query(
  "SELECT * FROM user WHERE status = :status AND id = :id",
  { status: userInputStatus, id: userId }
);
```


### Use Parameterized Queries and Placeholders for Dynamic Database Operations

**Use when**

When building SQL queries or executing raw statements using TypeORM query builders, repositories, entity managers, or database drivers with dynamic values.

**Secure rules**

**Rule 1: Always bind dynamic or untrusted user input using named or positional parameter placeholders rather than raw string concatenation.**

Concatenating untrusted variables directly into database query strings allows attackers to manipulate SQL commands and execute arbitrary queries. Always pass dynamic values through parameter bindings or repository search criteria options to ensure TypeORM safely parameterizes and escapes the inputs.

```typescript
const posts = await dataSource
  .createQueryBuilder(Post, "post")
  .where("post.name = :name", { name: userInput })
  .getMany();
```


### Validate Dynamic Identifiers and Enable Strict Isolation Settings

**Use when**

When constructing database schema inspections, DDL statements, sorting options, or complex conditional query clauses with untrusted identifiers or logical conditions.

**Secure rules**

**Rule 1: Validate dynamic SQL identifiers before raw interpolation in the `sql` tag**

When you embed a table, schema, or column name in a TypeORM **`sql`** tagged template by returning a string from a function expression, that string is inserted into the query **without any escaping or parameterization**. Never pass user-controlled values here. Instead, verify the identifier against a strict allow-list (or another strong validation routine) before inserting it.

```typescript
// Accept only known-safe table names
const ALLOWED_TABLES = new Set(["posts", "comments", "users"]);
const tableName = userInput.trim();

if (!ALLOWED_TABLES.has(tableName)) {
  throw new Error("Invalid table name");
}

// Safe: validated table name is inserted as raw SQL
const rows = await dataSource.sql`
  SELECT * FROM ${() => tableName}
`;
```

**Rule 2: Enable `isolateWhereStatements` to enclose each WHERE condition in parentheses**

Set `isolateWhereStatements: true` in your **DataSource** configuration so that TypeORM 1.1.0 automatically wraps every provided WHERE expression in brackets, ensuring compound `OR` conditions are correctly grouped when combined with additional filters.

```typescript
const dataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "user",
    password: "pass",
    database: "app",
    entities: [User],
    isolateWhereStatements: true,   // activates automatic brackets
});

await dataSource.initialize();

const sql = dataSource
  .createQueryBuilder(User, "user")
  .where("user.id = :id", { id: 1 })
  .andWhere("user.firstName = :s OR user.lastName = :s", { s: "alice" })
  .getSql();
// … WHERE user.id = ? AND (user.firstName = ? OR user.lastName = ?)
```


## Category: input contract definition

### Validate Entity Attributes Prior to Database Persistence

**Use when**

When validating entity attributes and enforcing schema constraints using class-validator before saving data to the database using TypeORM.

**Secure rules**

**Rule 1: Enforce input contract validation on entity properties before executing database persistence operations.**

Annotate entity properties with validation constraints using decorators and explicitly call `validate()` on the entity instance to reject malformed or out-of-contract data prior to calling save methods on the DataSource, EntityManager, or Repository.

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"
import { IsEmail, Length, validate } from "class-validator"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    @Length(3, 50)
    name: string

    @Column()
    @IsEmail()
    email: string
}

const user = new User()
user.name = req.body.name
user.email = req.body.email

const errors = await validate(user)
if (errors.length > 0) {
    throw new Error("Validation failed!")
} else {
    await dataSource.manager.save(user)
}
```


## Category: input interpretation safety

### Sanitize and validate user-supplied delimiters and commas in simple array column fields

**Use when**

Writing input validation logic before persisting data into simple-array columns in TypeORM entities.

**Secure rules**

**Rule 1: Sanitize and validate commas in input values before saving to `simple-array` columns.**

Prevent parsing ambiguities and unintended data splitting by inspecting untrusted input elements for embedded commas. Reject or sanitize any string containing commas before assigning it to properties mapped with `@Column("simple-array")` to ensure the internal representation remains unambiguous.

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column("simple-array")
    tags: string[]
}

function setUserTags(user: User, untrustedTags: string[]) {
    for (const tag of untrustedTags) {
        if (tag.includes(",")) {
            throw new Error("Tag value contains invalid character: comma")
        }
    }
    user.tags = untrustedTags
}
```


## Category: resource exhaustion

### Configure Query Execution Timeouts and Limits to Prevent Resource Exhaustion

**Use when**

Configuring database connections and executing queries in TypeORM to bound execution time and prevent resource starvation.

**Secure rules**

**Rule 1: Set query execution timeouts within the driver options to limit query duration and prevent connection pool exhaustion.**

Enable query timeouts by setting `enableQueryTimeout` to true and specifying a `maxQueryExecutionTime` limit in milliseconds within your `DataSource` driver options. This bounds query duration and mitigates connection pool starvation from unbounded operations.

```typescript
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "db_user",
    password: "db_password",
    database: "app_db",
    enableQueryTimeout: true,
    maxQueryExecutionTime: 5000,
    entities: []
});
```


## Category: secret handling

### Exclude Sensitive Entity Columns and URL-Encode Connection Credentials

**Use when**

When defining entity columns that store sensitive data or when configuring connection URLs with special characters.

**Secure rules**

**Rule 1: Explicitly exclude sensitive columns from standard query selections and properly encode connection URL credentials.**

Set `{ select: false }` on entity columns storing sensitive information like passwords or tokens to prevent them from being queried by default. Additionally, percent-encode credential components when constructing database connection URL strings.

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    email: string

    @Column({ select: false })
    passwordHash: string
}
```


### Load Database Credentials and Encryption Keys Securely from Environment Variables

**Use when**

When configuring database connections, data sources, authentication options, or encryption keys in application code.

**Secure rules**

**Rule 1: Load database credentials, authentication secrets, and encryption keys dynamically from environment variables or dedicated secret management services.**

Do not embed passwords, usernames, TLS private keys, connection strings, or encryption keys directly into source code or static configuration files. Supply these secrets dynamically at runtime using process environment variables.

```typescript
import { DataSource } from "typeorm"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: false,
})
```
