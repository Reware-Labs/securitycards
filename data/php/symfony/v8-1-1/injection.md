# Security cards

Repository: `https://github.com/symfony/symfony#v8.1.1`
Category: injection

## injection

### Use Query Placeholders for LDAP Search Queries

**Use when**

When configuring custom LDAP user search queries with `LdapBadge` in Symfony security components to prevent LDAP injection.

**Secure rules**

**Rule 1: Use Symfony's LDAP query placeholders instead of concatenating raw user input into search strings.**

Pass search query templates containing placeholders like `{user_identifier}` to `LdapBadge`. This ensures user identifiers are safely escaped using `LdapInterface::ESCAPE_FILTER` automatically before directory lookups are executed.

```php
use Symfony\Component\Ldap\Security\LdapBadge;

$badge = new LdapBadge(
    'app.ldap',
    'dn=host,dc=example,dc=com',
    'admin_user',
    'admin_password',
    '(sAMAccountName={user_identifier})'
);
```
