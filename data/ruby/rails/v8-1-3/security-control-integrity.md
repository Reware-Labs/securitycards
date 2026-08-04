# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: security control integrity

## security control integrity

### Enforce database-level referential integrity and uniqueness constraints

**Use when**

Developing database migrations and defining ActiveRecord associations where model-level validations are insufficient to prevent race conditions and bypasses.

**Secure rules**

**Rule 1: Specify foreign key constraints in table migrations for associations.**

Explicitly include `foreign_key: true` when defining table associations in migrations so that referential integrity is enforced at the database layer rather than relying exclusively on model-level validations.

```ruby
class CreateBooks < ActiveRecord::Migration[8.1]
  def change
    create_table :books do |t|
      t.belongs_to :author, foreign_key: true
      t.datetime :published_at
      t.timestamps
    end
  end
end
```

**Rule 2: Add unique database indexes for sensitive unique identifier columns.**

Enforce database-level uniqueness constraints using unique indexes in migrations for sensitive identifier columns like emails or usernames to protect against race conditions.

```ruby
create_table :users do |t|
  t.string :name, index: true
  t.string :email, index: { unique: true, name: "unique_emails" }
end
```


### Prevent unintended writes during read-only database operations

**Use when**

Switching ActiveRecord connection roles to reading and executing read-only code blocks where write operations must be blocked.

**Secure rules**

**Rule 1: Set prevent_writes: true when switching connection roles to reading.**

Pass `prevent_writes: true` when manually switching connection roles via `ActiveRecord::Base.connected_to` to enforce application-level blocking of write operations and prevent accidental state changes.

```ruby
ActiveRecord::Base.connected_to(role: :reading, prevent_writes: true) do
  Person.all
end
```
