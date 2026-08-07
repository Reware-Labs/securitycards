# Security cards

Repository: `https://github.com/jaredhanson/passport#v0.7.0`
Category: security control integrity

## security control integrity

### Instantiate isolated Passport instances for distinct authentication contexts

**Use when**

When building applications that require isolated authentication contexts, such as multi-tenant systems or decoupled sub-applications running within the same process.

**Secure rules**

**Rule 1: Instantiate separate Passport instances using the Authenticator constructor instead of using the global default singleton.**

Prevent configuration leakage and cross-tenant authentication bypasses by instantiating separate Passport instances using `new Passport()` rather than modifying the global singleton state. Register strategies, user serialization rules, and middleware explicitly on each isolated instance.

```javascript
const { Passport } = require('passport');

const adminPassport = new Passport();
const userPassport = new Passport();

adminPassport.use('local', adminStrategy);
userPassport.use('local', userStrategy);

app.use('/admin', adminPassport.initialize());
app.use('/user', userPassport.initialize());
```
