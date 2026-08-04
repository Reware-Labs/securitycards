# Security cards

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`
Category: injection

## injection

### Prevent Expression Language Injection by Using Safe Contexts and Variable Binding

**Use when**

Parsing and evaluating dynamic or user-influenced SpEL expressions.

**Secure rules**

**Rule 1: Avoid concatenating untrusted input directly into SpEL expressions and use evaluation context variables instead.**

Parse static expression templates using `SpelExpressionParser` and pass dynamic parameters safely via evaluation context variables (`#variableName` syntax) or evaluation context property accessors to prevent attackers from manipulating expression syntax.

```java
SpelExpressionParser parser = new SpelExpressionParser();
StandardEvaluationContext ctx = new StandardEvaluationContext();
Expression expr = parser.parseRaw("(hasRole('SUPERVISOR') or (#a < 1.042))");
ctx.setVariable("a", dynamicThresholdValue);
Boolean authorized = expr.getValue(ctx, Boolean.class);
```

**Rule 2: Restrict SpEL evaluation capabilities by using SimpleEvaluationContext for data binding.**

Use `SimpleEvaluationContext` instead of `StandardEvaluationContext` when processing dynamic or user-influenced expressions to restrict unsafe behaviors such as arbitrary variable assignment, constructor invocations, and arbitrary Java method execution.

```java
EvaluationContext context = SimpleEvaluationContext.forReadWriteDataBinding().build();
ExpressionParser parser = new SpelExpressionParser();
Expression expr = parser.parseExpression("name");
Object value = expr.getValue(context);
```

**Rule 3: Configure strict maximum expression lengths and operation limits on SpEL parsers.**

Instantiate `SpelParserConfiguration` with custom maximum bounds for expression length, maximum operations, and auto-growth limits to prevent resource-intensive operations and denial of service attacks.

```java
SpelParserConfiguration config = new SpelParserConfiguration(
    SpelCompilerMode.OFF,
    null,
    false,
    false,
    100,
    1000,
    5000
);
SpelExpressionParser parser = new SpelExpressionParser(config);
```

**Rule 4: Restrict callable methods on target objects by registering custom MethodFilters.**

Register custom `MethodFilter` instances via `context.registerMethodFilter()` when evaluating SpEL expressions using `StandardEvaluationContext` to ensure only explicitly allowed methods are executed.

```java
StandardEvaluationContext context = new StandardEvaluationContext(rootObject);
context.registerMethodFilter(TargetClass.class, methods -> {
    List<Method> allowed = new ArrayList<>();
    for (Method method : methods) {
        if (method.isAnnotationPresent(AllowedSpelMethod.class)) {
            allowed.add(method);
        }
    }
    return allowed;
});
```


### Use Parameterized Queries and Named Parameters to Prevent SQL Injection

**Use when**

When writing database queries, database startup validators, scripts, or stored procedures using Spring JDBC and Spring R2DBC.

**Secure rules**

**Rule 1: Avoid custom validation queries in DatabaseStartupValidator and rely on JDBC 4.0 connection validity checks.**

Do not supply dynamic or untrusted SQL query strings to DatabaseStartupValidator.setValidationQuery(). Rely on the default JDBC 4.0 Connection.isValid() check by leaving the validation query unset to avoid raw SQL statement execution on JDBC connections.

```java
DatabaseStartupValidator validator = new DatabaseStartupValidator();
validator.setDataSource(dataSource);
validator.setInterval(2);
validator.setTimeout(30);
```

**Rule 2: Use named parameter placeholders for R2DBC SQL queries instead of string concatenation.**

When defining SQL queries in Spring R2DBC, developers must use named parameter placeholders like `:name` or `:{name}` rather than concatenating user input directly into SQL strings. Always write parameterized SQL templates and pass values through DatabaseClient or BindParameterSource.

```java
String sql = "SELECT id, username, email FROM users WHERE status = :status AND tenant_id = :tenantId";

databaseClient.sql(sql)
    .bind("status", userStatus)
    .bind("tenantId", tenantId)
    .fetch()
    .all();
```

**Rule 3: Execute SQL initialization scripts exclusively from trusted and immutable application resources.**

Execute SQL scripts only from immutable and trusted application resources using `ScriptUtils.executeSqlScript()`. Ensure script paths or contents do not originate from unverified user inputs.

```java
Resource schemaScript = new ClassPathResource("db/schema.sql");
ScriptUtils.executeSqlScript(connection, schemaScript);
```

**Rule 4: Declare explicit parameters for Spring StoredProcedure execution.**

When executing database stored procedures with Spring JDBC `StoredProcedure` classes, always declare parameters using `SqlParameter` and `SqlOutParameter` and use parameter placeholders rather than dynamically concatenating input strings.

```java
public class AddInvoiceProcedure extends StoredProcedure {
    public AddInvoiceProcedure(DataSource dataSource) {
        setDataSource(dataSource);
        setSql("add_invoice");
        declareParameter(new SqlParameter("amount", Types.INTEGER));
        declareParameter(new SqlParameter("custid", Types.INTEGER));
        declareParameter(new SqlOutParameter("newid", Types.INTEGER));
        compile();
    }

    public int execute(int amount, int custid) {
        Map<String, Object> inParams = new HashMap<>();
        inParams.put("amount", amount);
        inParams.put("custid", custid);
        Map<String, Object> out = execute(inParams);
        return ((Number) out.get("newid")).intValue();
    }
}
```

**Rule 5: Construct SQL query strings using static templates with named parameter placeholders via NamedParameterUtils.**

Always construct SQL query strings using static templates with named parameter placeholders rather than dynamically concatenating untrusted user input into the SQL string prior to parsing.

```java
String sql = "SELECT id, username FROM users WHERE status = :status AND role = :role";
MapSqlParameterSource params = new MapSqlParameterSource()
    .addValue("status", userStatus)
    .addValue("role", userRole);
ParsedSql parsedSql = NamedParameterUtils.parseSqlStatement(sql);
String substitutedSql = NamedParameterUtils.substituteNamedParameters(parsedSql, params);
```
