# Security cards

Repository: `https://github.com/ktorio/ktor#3.5.1`
Category: injection

## injection

### Sanitize Untrusted Input for LDAP Queries

**Use when**

When constructing dynamic LDAP queries or Distinguished Names using untrusted user inputs in Ktor server applications.

**Secure rules**

**Rule 1: Neutralize special LDAP characters in user-supplied strings before building query filters or Distinguished Names.**

Pass all dynamic user input strings through `ldapEscape` to ensure meta-characters are safely escaped and interpreter syntax neutralization is maintained.

```kotlin
val safeUsername = ldapEscape(userInput)
val userDn = "cn=$safeUsername,ou=users,dc=example,dc=com"
```
