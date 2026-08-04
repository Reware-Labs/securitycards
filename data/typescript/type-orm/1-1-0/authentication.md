# Security cards

Repository: `https://github.com/typeorm/typeorm#1.1.0`
Category: authentication

## authentication

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
