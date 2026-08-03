# Security cards

Repository: `https://github.com/spf13/cobra#v1.10.2`
Documentation repository: `https://github.com/spf13/cobra.dev#master`
Category: security control integrity

## security control integrity

### Enable hook traversal to ensure ancestor security checks execute

**Use when**

When implementing global security controls, token validation, user authentication, or privilege checks in parent command PersistentPreRun hooks within Cobra CLI applications.

**Secure rules**

**Rule 1: Enable cobra.EnableTraverseRunHooks so that ancestor pre-run and post-run hooks execute down the command tree.**

Set `cobra.EnableTraverseRunHooks = true` during application initialization to ensure that parent and child command `PersistentPreRun` hooks are properly traversed and executed. By default, Cobra only executes the nearest defined pre-run hook in the command hierarchy, which can cause child commands to silently bypass parent security validations.

```go
package main

import "github.com/spf13/cobra"

func main() {
	// Traverse and execute all parent persistent pre-run/post-run hooks
	cobra.EnableTraverseRunHooks = true
}
```
