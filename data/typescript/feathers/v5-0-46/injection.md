# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`
Category: injection

## injection

### Configure disabled operators to prevent untrusted query parameter manipulation in MongoDB services

**Use when**

When initializing MongoDB services in Feathers to restrict query update operators and prevent unauthorized field modification.

**Secure rules**

**Rule 1: Explicitly configure disabled operators on the MongoDB service to block unwanted update operators.**

Prevent untrusted query operators from altering document fields by setting `disabledOperators` during the initialization of the `MongoDBService` class.

```ts
new MongoDBService({
  Model: app.get('mongodbClient').then((db) => db.collection('users')),
  disabledOperators: ['$rename', '$unset', '$inc']
})
```
