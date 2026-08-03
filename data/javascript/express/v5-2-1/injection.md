# Security cards

Repository: `https://github.com/expressjs/express#v5.2.1`
Documentation repository: `https://github.com/expressjs/expressjs.com#main`
Category: injection

## injection

### Use Parameterized Queries for Database Interactions

**Use when**

Building database queries within Express handlers using user-supplied input.

**Secure rules**

**Rule 1: Always use parameterized queries, bind variables, or prepared statements when interacting with databases.**

Pass dynamic parameters separately as driver positional arguments, bind variables, or prepared statement inputs rather than concatenating user input directly into query strings to prevent injection vulnerabilities.

```javascript
// Safe PostgreSQL parameterized query using pg-promise
db.one('SELECT * FROM users WHERE id = $1', [userId]);
```
