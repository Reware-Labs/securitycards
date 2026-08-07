# Security cards

Repository: `https://github.com/hibernate/hibernate-orm#7.4.5`
Category: access control

## access control

### Isolate Multi-Tenant Data with Authenticated Security Contexts

**Use when**

Enabling multi-tenancy in Hibernate session factories and configuring tenant identification for data isolation.

**Secure rules**

**Rule 1: Explicitly specify the tenant identifier when opening multitenant sessions**

When the application does not use a `CurrentTenantIdentifierResolver`, pass the applicable tenant identifier through `SessionFactory.withOptions()` when opening each session.

```java
try (Session session = sessionFactory.withOptions()
        .tenantIdentifier(tenantId)
        .openSession()) {
    // Perform operations for this tenant.
}
```
