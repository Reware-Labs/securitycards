# Security cards

Repository: `https://github.com/typeorm/typeorm#1.1.0`
Category: input contract definition

## input contract definition

### Validate Entity Attributes Prior to Database Persistence

**Use when**

When validating entity attributes and enforcing schema constraints using class-validator before saving data to the database using TypeORM.

**Secure rules**

**Rule 1: Enforce input contract validation on entity properties before executing database persistence operations.**

Annotate entity properties with validation constraints using decorators and explicitly call `validate()` on the entity instance to reject malformed or out-of-contract data prior to calling save methods on the DataSource, EntityManager, or Repository.

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"
import { IsEmail, Length, validate } from "class-validator"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    @Length(3, 50)
    name: string

    @Column()
    @IsEmail()
    email: string
}

const user = new User()
user.name = req.body.name
user.email = req.body.email

const errors = await validate(user)
if (errors.length > 0) {
    throw new Error("Validation failed!")
} else {
    await dataSource.manager.save(user)
}
```
