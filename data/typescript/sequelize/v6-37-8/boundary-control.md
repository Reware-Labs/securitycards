# Security cards

Repository: `https://github.com/sequelize/sequelize#v6.37.8`
Category: boundary control

## boundary control

### Validate Post-Commit Callback Handlers Pass Callable Functions

**Use when**

Registering post-commit callbacks on transaction instances using Sequelize

**Secure rules**

**Rule 1: Verify that post-commit callback handlers are functions before registering them on a transaction.**

Always check that post-commit hook arguments are functions before registering them on the transaction instance using `t.afterCommit(fn)` to prevent runtime errors.

```javascript
await sequelize.transaction(async (t) => {
  await User.update({ status: 'active' }, { where: { id: userId }, transaction: t });
  if (typeof onCommitCallback === 'function') {
    t.afterCommit(onCommitCallback);
  }
});
```
