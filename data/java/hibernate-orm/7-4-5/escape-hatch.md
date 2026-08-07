# Security cards

Repository: `https://github.com/hibernate/hibernate-orm#7.4.5`
Category: escape hatch

## escape hatch

### Restrict raw SQL modifications in StatementInspector

**Use when**

When registering custom StatementInspector instances to inspect or modify SQL statements before execution.

**Secure rules**

**Rule 1: Keep auditing StatementInspector implementations non-mutating**

When a `StatementInspector` is used only for auditing or observation, return `null` so Hibernate executes the original SQL unchanged instead of replacing it with modified SQL.

```java
public final class AuditingStatementInspector implements StatementInspector {
    @Override
    public String inspect(String sql) {
        audit(sql);
        return null;
    }

    private void audit(String sql) {
        // Record the statement according to the application's audit policy.
    }
}

HibernatePersistenceConfiguration config =
        new HibernatePersistenceConfiguration("prod-pu")
                .statementInspector(AuditingStatementInspector.class);
```
