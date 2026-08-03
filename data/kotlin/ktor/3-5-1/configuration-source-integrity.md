# Security cards

Repository: `https://github.com/ktorio/ktor#3.5.1`
Category: configuration source integrity

## configuration source integrity

### Prevent configuration failure by validating structural integrity and environment bindings

**Use when**

When loading configuration files and setting environment properties in Ktor applications.

**Secure rules**

**Rule 1: Avoid recursive reference loops in YAML configuration files.**

Ensure self-referencing property aliases in YAML configurations do not introduce circular references, as Ktor's `YamlConfig` will raise an `ApplicationConfigurationException` to block invalid configuration loading.

```yaml
value:
  domain: "example.com"
config:
  endpoint: "https://${value.domain}/api"
```

**Rule 2: Ensure all referenced environment variables are defined prior to application launch.**

Verify that all environment variables referenced in YAML configuration files are explicitly defined in the runtime environment to prevent initialization failures when `YamlConfig` fails fast.

```yaml
ktor:
  deployment:
    port: $PORT
```

**Rule 3: Safely read optional properties and deserialize typed configurations from ApplicationConfig.**

Use `propertyOrNull` to access optional key-value properties or `getAs` to map typed configuration objects safely instead of throwing unhandled exceptions.

```kotlin
val config = MapApplicationConfig(
    "host" to "0.0.0.0",
    "port" to "8080"
)

val salt: String? = config.propertyOrNull("auth.salt")?.getString()
val rootConfig: RootConfig? = config.getAs<RootConfig>()
```

**Rule 4: Ensure all dynamically referenced dependency factory functions and classes are publicly accessible.**

Verify that functions and classes loaded via external application configuration files are publicly accessible to avoid `DependencyInjectionException` during dependency injection initialization.

```kotlin
fun createBankService(): BankService = BankServiceImpl()
```
