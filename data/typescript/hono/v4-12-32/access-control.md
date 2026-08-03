# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`
Category: access control

## access control

### Enforce IP Restriction Rules and Deny Lists for Protected Routes

**Use when**

When restricting endpoint access by source IP addresses using allow lists and deny lists in Hono applications.

**Secure rules**

**Rule 1: Configure deny lists and allow lists explicitly using ipRestriction middleware to enforce fail-closed access control.**

The ipRestriction middleware evaluates denyList rules before allowList rules, denying access immediately if a match occurs. When an allowList is specified and non-empty, any IP address not explicitly matching the allowList is denied access by default. Ensure reliable connection retrieval functions are provided.

```typescript
app.use(
  '/admin/*',
  ipRestriction(
    getConnInfo,
    {
      denyList: ['10.0.0.0/8'],
      allowList: ['192.168.1.0/24', '127.0.0.1']
    },
    (remote, c) => c.text('Forbidden', 403)
  )
)
```
