# Security cards

Repository: `https://github.com/typeorm/typeorm#1.1.0`
Category: api contract misuse

## api contract misuse

### Adhere to TypeORM API contracts and argument constraints

**Use when**

Calling TypeORM repository, entity manager, query builder, and transaction methods where specific arguments, types, call orders, criteria objects, and lock options are required.

**Secure rules**

**Rule 1: Provide numeric arguments to QueryBuilder limit methods**

Ensure arguments passed to QueryBuilder limit methods are strictly numeric values. TypeORM validates limit arguments in `UpdateQueryBuilder` and `SoftDeleteQueryBuilder` and throws an error when non-numeric inputs are supplied.

```typescript
const safeLimit = Number.isInteger(Number(req.query.limit)) ? Math.max(1, Number(req.query.limit)) : 10;
await dataSource
  .createQueryBuilder()
  .update(Post)
  .set({ text: "updated" })
  .where("id = :id", { id: postId })
  .limit(safeLimit)
  .execute();
```

**Rule 2: Pass plain object criteria when relying on invalidWhereValuesBehavior**

Ensure criteria passed to repository find, update, delete, softDelete, or restore methods are plain `FindOptionsWhere` objects when depending on `invalidWhereValuesBehavior` runtime validation. Passing entity class instances directly circumvents this behavior normalization, allowing null property values on the entity instance to pass through unvalidated into queries.

```typescript
import { IsNull } from "typeorm"

await repository.delete({
    text: IsNull(),
})
```

**Rule 3: Ensure unique parameter names across QueryBuilder expressions**

Assign unique parameter keys across all expressions within a single QueryBuilder chain rather than reusing generic placeholder names like `:id` multiple times to prevent parameter overriding and unexpected data access.

```typescript
const result = await dataSource
    .getRepository(User)
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.linkedSheep", "linkedSheep")
    .leftJoinAndSelect("user.linkedCow", "linkedCow")
    .where("user.linkedSheep = :sheepId", { sheepId })
    .andWhere("user.linkedCow = :cowId", { cowId })
    .getOne();
```

**Rule 4: Ensure entity instances have primary keys populated before soft deletion**

When target entity instances are passed to `.whereEntity(entity)`, verify that all primary key fields are set. `SoftDeleteQueryBuilder` enforces runtime checks via `getEntityIdMap()` and throws an error if primary key values are missing.

```typescript
const user = await userRepository.findOneBy({ id: userId });
if (user && user.id) {
    await dataSource
        .createQueryBuilder()
        .softDelete()
        .from(User)
        .whereEntity(user)
        .execute();
}
```

**Rule 5: Execute pessimistic query builder locks inside database transactions**

When executing queries with pessimistic locks using `QueryBuilder.setLock()`, TypeORM requires an active database transaction. Always execute locked queries using the transactional EntityManager inside `dataSource.manager.transaction()`.

```typescript
await dataSource.manager.transaction(async (transactionalEntityManager) => {
    const post = await transactionalEntityManager
        .createQueryBuilder(PostWithVersion, "post")
        .setLock("pessimistic_write")
        .where("post.id = :id", { id: 1 })
        .getOne()
})
```

**Rule 6: Restrict optimistic locking queries to single entity lookups**

Optimistic locking specified via `QueryBuilder.setLock("optimistic", version)` is supported exclusively for single-entity retrievals using `getOne()`. Calling aggregate fetch methods with an optimistic lock throws an `OptimisticLockCanNotBeUsedError`.

```typescript
const post = await dataSource
    .createQueryBuilder(PostWithVersion, "post")
    .setLock("optimistic", expectedVersion)
    .where("post.id = :id", { id: 1 })
    .getOne()
```

**Rule 7: Avoid bidirectional cascade remove configuration on entity relations**

Do not configure bidirectional cascade removal on both sides of an entity relationship. TypeORM metadata validation rejects models where both sides of a relation enable cascade removal.

```typescript
@Entity()
export class ParentEntity {
    @OneToMany(() => ChildEntity, (child) => child.parent, { cascade: ["remove"] })
    children: ChildEntity[];
}

@Entity()
export class ChildEntity {
    @ManyToOne(() => ParentEntity, (parent) => parent.children)
    parent: ParentEntity;
}
```

**Rule 8: Always use the provided transactional entity manager within transactions**

When executing database operations inside a transaction callback via `DataSource.transaction()` or `DataSource.manager.transaction()`, always use the transactional entity manager passed as the callback argument rather than any global, outer, or repository entity manager.

```typescript
await myDataSource.manager.transaction(async (transactionalEntityManager) => {
    await transactionalEntityManager.save(users)
    await transactionalEntityManager.save(photos)
})
```

**Rule 9: Specify valid transaction isolation levels to prevent concurrency anomalies**

Explicitly supply driver-supported transaction isolation levels when starting transactions using `dataSource.manager.transaction(isolationLevel, runInTransaction)` to ensure database prerequisites are met and avoid cross-session isolation leakages.

```typescript
await dataSource.manager.transaction("SERIALIZABLE", async (transactionalEntityManager) => {
  const post = new Post();
  post.title = "Secure Transaction Post";
  await transactionalEntityManager.save(post);
});
```
