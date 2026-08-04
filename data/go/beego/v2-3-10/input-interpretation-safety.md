# Security cards

Repository: `https://github.com/beego/beego#v2.3.10`
Category: input interpretation safety

## input interpretation safety

### Sanitize and Validate Automatically Decoded Route Parameters and Request Inputs

**Use when**

Extracting and utilizing route parameters, query strings, or request payloads in Beego applications where automated decoding or interpretation boundaries apply.

**Secure rules**

**Rule 1: Constrain route parameters with Beego route expressions when their format is known**

Define the accepted format in the route using `:param(reg)` or a built-in constraint such as `:id:int`. Beego only invokes the handler when the path value matches the route expression, and the matched value remains available through `ctx.Input.Param()`.

```go
package main

import (
	"github.com/beego/beego/v2/server/web"
	"github.com/beego/beego/v2/server/web/context"
)

func main() {
	web.Get("/search/:keyword([A-Za-z0-9_]+)", func(ctx *context.Context) {
		keyword := ctx.Input.Param(":keyword")
		ctx.WriteString(keyword)
	})

	web.Run()
}
```
