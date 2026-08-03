# Security cards

Repository: `https://github.com/typeorm/typeorm#1.1.0`
Category: secret handling

## secret handling

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
