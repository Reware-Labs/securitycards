# Security cards

Repository: `https://github.com/beego/beego#v2.3.10`
Category: deserialization

## deserialization

### Register Custom Types Before Gob Deserialization

**Use when**

When storing and retrieving custom struct types in Beego session providers that utilize `gob` encoding and decoding.

**Secure rules**

**Rule 1: Explicitly register custom Go types using gob.Register during application initialization before session reading or writing occurs.**

Because session providers in Beego serialize and deserialize values using `gob` encoding, any custom struct types saved into the session must be registered with `gob.Register` during application initialization to prevent decoding errors and ensure correct session restoration.

```go
import (
	"encoding/gob"
	"github.com/beego/beego/v2/server/web"
)

type UserSession struct {
	UserID int
	Role   string
}

func init() {
	gob.Register(UserSession{})
}
```
