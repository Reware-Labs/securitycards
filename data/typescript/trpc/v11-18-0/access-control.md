# Security cards

Repository: `https://github.com/trpc/trpc#v11.18.0`
Category: access control

## access control

### Enforce Role and Membership Authorization Checks in tRPC Procedures

**Use when**

Developing tRPC procedures that require verification of organization membership, role assignment, or resource ownership before granting access.

**Secure rules**

**Rule 1: Validate organization membership or resource ownership within procedure middleware and throw a FORBIDDEN TRPCError on failure.**

Chain base procedures and middleware to verify authorization boundaries against validated inputs. If the membership check fails, throw a `TRPCError` with code `FORBIDDEN` to prevent unauthorized cross-tenant data access.

```typescript
export const organizationProcedure = authedProcedure
  .input(z.object({ organizationId: z.string() }))
  .use(function isMemberOfOrganization(opts) {
    const membership = opts.ctx.user.memberships.find(
      (m) => m.Organization.id === opts.input.organizationId,
    );
    if (!membership) {
      throw new TRPCError({
        code: 'FORBIDDEN',
      });
    }
    return opts.next({
      ctx: {
        Organization: membership.Organization,
      },
    });
  });
```
