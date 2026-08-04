# Security cards

Repository: `https://github.com/quarkusio/quarkus#3.38.0`
Category: configuration source integrity

## configuration source integrity

### Avoid mixing programmatic and property security configurations

**Use when**

Configuring security controls in Quarkus using both configuration files and programmatic builders simultaneously.

**Secure rules**

**Rule 1: Choose a single primary mechanism for defining HTTP security configurations to prevent configuration overlap**

Avoid defining HTTP security controls such as CORS, form authentication, basic authentication, or mTLS simultaneously in `application.properties` and via the `HttpSecurity` programmatic builder. When using programmatic `HttpSecurity` customization, ensure related `application.properties` settings are omitted to prevent runtime exceptions or dropped configuration mappings.

```java
public void configureSecurity(@jakarta.enterprise.event.Observes HttpSecurity http) {
    http.path("/api/*")
        .methods("GET", "POST")
        .authenticated();
}
```


### Enforce Extension Catalog and BOM Integrity

**Use when**

Configuring Quarkus platform descriptors, extension catalogs, and dependencies to prevent untrusted artifact resolution during build time.

**Secure rules**

**Rule 1: Explicitly declare BOM origins, exact artifact coordinates, provided capabilities, and extension dependencies in Quarkus extension catalogs**

Ensure extension platform descriptors map explicit artifact coordinates and origin mappings to their platform BOMs so Quarkus tooling can identify extension origins and platform compatibility.

```json
{
  "id": "io.quarkus:quarkus-bom-quarkus-platform-descriptor:3.38.0:json:3.38.0",
  "platform": true,
  "bom": "io.quarkus:quarkus-bom::pom:3.38.0",
  "extensions": [
    {
      "name": "ArC",
      "artifact": "io.quarkus:quarkus-arc::jar:3.38.0",
      "origins": [ "io.quarkus:quarkus-bom-quarkus-platform-descriptor:3.38.0:json:3.38.0" ],
      "metadata": {
        "capabilities": { "provides": [ "io.quarkus.cdi" ] },
        "extension-dependencies": [ "io.quarkus:quarkus-core" ]
      }
    }
  ]
}
```
