# Security cards

Repository: `https://github.com/typeorm/typeorm#1.1.0`
Category: input interpretation safety

## input interpretation safety

### Sanitize and validate user-supplied delimiters and commas in simple array column fields

**Use when**

Writing input validation logic before persisting data into simple-array columns in TypeORM entities.

**Secure rules**

**Rule 1: Sanitize and validate commas in input values before saving to `simple-array` columns.**

Prevent parsing ambiguities and unintended data splitting by inspecting untrusted input elements for embedded commas. Reject or sanitize any string containing commas before assigning it to properties mapped with `@Column("simple-array")` to ensure the internal representation remains unambiguous.

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column("simple-array")
    tags: string[]
}

function setUserTags(user: User, untrustedTags: string[]) {
    for (const tag of untrustedTags) {
        if (tag.includes(",")) {
            throw new Error("Tag value contains invalid character: comma")
        }
    }
    user.tags = untrustedTags
}
```
