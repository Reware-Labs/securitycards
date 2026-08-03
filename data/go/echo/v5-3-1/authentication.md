# Security cards

Repository: `https://github.com/labstack/echo#v5.3.1`
Category: authentication

## authentication

### Use Constant-Time Comparison in Authentication Validators

**Use when**

Implementing custom validator callback functions for authentication middleware such as BasicAuth or KeyAuth to verify credentials securely.

**Secure rules**

**Rule 1: Use constant-time comparison functions when evaluating credentials inside validator callbacks.**

When implementing validator functions for `BasicAuth` or `KeyAuth`, always compare credentials using `crypto/subtle.ConstantTimeCompare` instead of standard Go string equality operators or switch statements. Standard string comparisons leak timing information via short-circuiting, allowing attackers to perform side-channel attacks and enumerate credentials character by character.

```go
import (
	"crypto/subtle"
	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
)

func secureKeyValidator(c *echo.Context, key string, source middleware.ExtractorSource) (bool, error) {
	validKey := "secret-api-key-12345"
	if subtle.ConstantTimeCompare([]byte(key), []byte(validKey)) == 1 {
		return true, nil
	}
	return false, nil
}
```
