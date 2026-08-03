# Security cards

Repository: `https://github.com/automattic/mongoose#9.8.0`
Category: resource exhaustion

## resource exhaustion

### Configure global query execution timeouts to prevent resource exhaustion

**Use when**

Developing database queries and operations that require protection against unbounded execution times and denial-of-service conditions.

**Secure rules**

**Rule 1: Set a global `maxTimeMS` timeout on all Mongoose queries to enforce execution limits.**

Configure `maxTimeMS` globally using `mongoose.set('maxTimeMS', ms)` to ensure that unoptimized aggregations or complex queries fail fast instead of consuming database CPU, memory, and connection slots indefinitely.

```javascript
const mongoose = require('mongoose');

// Attach maxTimeMS limit of 5 seconds to all queries
mongoose.set('maxTimeMS', 5000);
```
