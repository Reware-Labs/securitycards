# Security cards

Repository: `https://github.com/ollama/ollama#v0.32.5`
Category: security control integrity

## security control integrity

### Fail Closed on SQLite Foreign Key Constraint Initialization

**Use when**

When initializing SQLite database connections for data storage and state management.

**Secure rules**

**Rule 1: Enforce SQLite foreign key constraints immediately during connection establishment and database initialization.**

Always configure SQLite database connections to enforce foreign key constraints by appending `_foreign_keys=on` to the DSN and executing `PRAGMA foreign_keys = ON` upon initialization to maintain data integrity and prevent cascading delete failures.

```go
conn, err := sql.Open("sqlite3", dbPath+"?_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000&_txlock=immediate")
if err != nil {
    return nil, err
}
_, err = conn.Exec("PRAGMA foreign_keys = ON")
```
