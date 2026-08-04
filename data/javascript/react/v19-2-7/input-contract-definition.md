# Security cards

Repository: `https://github.com/react/react#v19.2.7`
Documentation repository: `https://github.com/reactjs/react.dev#main`
Category: input contract definition

## input contract definition

### Validate all arguments passed into Server Actions on the server

**Use when**

When building React Server Actions that receive network inputs and parameters from clients.

**Secure rules**

**Rule 1: Validate all parameters and arguments received inside Server Actions on the server before processing business logic or mutating state.**

Always inspect and validate types, lengths, and expected values of all arguments received in Server Actions. Reject malformed inputs or missing required fields prior to application processing.

```javascript
'use server';
import { addTodo } from './db';

export async function createTodo(text) {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return 'Please enter a valid todo.';
  }
  addTodo(text.trim());
  return 'Added successfully';
}
```
