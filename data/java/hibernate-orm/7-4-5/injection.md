# Security cards

Repository: `https://github.com/hibernate/hibernate-orm#7.4.5`
Category: injection

## injection

### Use Parameterized Queries for Hibernate HQL and Native SQL

**Use when**

Building HQL, JPQL, or native SQL queries that incorporate dynamic values or collection inputs.

**Secure rules**

**Rule 1: Bind untrusted values through query parameters instead of concatenating query strings.**

Use named parameters with `setParameter` or collection parameters with `setParameterList` to ensure inputs are safely bound via parameter setters and kept separate from query syntax.

```java
List<Zoo> result = session.createQuery(
        "FROM Zoo z WHERE z.name IN (?1) and z.address.city IN (?2)", Zoo.class)
    .setParameterList(1, namesArray)
    .setParameterList(2, citiesArray)
    .list();
```
