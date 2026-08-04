# Security cards

Repository: `https://github.com/ollama/ollama#v0.32.5`
Category: boundary control

## boundary control

### Validate Model Namespaces and Names in Multi-Tenant Model Serving

**Use when**

Developing multi-tenant model serving endpoints where clients supply model names and paths that must be restricted to authorized tenant namespaces.

**Secure rules**

**Rule 1: Enforce authorization for every model request outside Ollama**

Parse and validate the canonical model name, then authorize that full name in the authenticated application or proxy before forwarding the request to Ollama.

```go
parsed := model.ParseName(userRequestedModel)
if !parsed.IsValid() {
    return errors.New("invalid model name")
}
if !authorizeModel(currentTenant, parsed.String()) {
    return errors.New("access denied")
}
// Proceed with model serving
```

**Rule 2: Prevent traversal vulnerabilities by validating model paths and qualification.**

Always parse model paths using `model.ParseNameFromFilepath` and ensure `IsFullyQualified()` returns true before calling `.Filepath()` to prevent unauthorized cross-tenant file access and runtime panics.

```go
import "github.com/ollama/ollama/types/model"

func LoadTenantModel(userSuppliedPath string) (model.Name, bool) {
    n := model.ParseNameFromFilepath(userSuppliedPath)
    if !n.IsValid() || n.Namespace == "" || n.Model == "" {
        return model.Name{}, false
    }
    return n, true
}
```


### Validate native binding arguments at the bridge boundary

**Use when**

Registering and implementing native host functions exposed to untrusted JavaScript via webview bindings.

**Secure rules**

**Rule 1: Treat incoming JSON request parameters in native binding callbacks as untrusted input and validate all arguments before processing.**

When exposing native C or C++ host functions using `webview_bind`, always parse and validate the JSON request parameter (`req`) completely before passing any values into system functions, file operations, or native APIs.

```c
void my_binding_cb(const char *seq, const char *req, void *arg) {
    webview_t w = (webview_t)arg;
    /* Parse req, validate input values, then return result */
    webview_return(w, seq, 0, "{\"status\":\"success\"}");
}

webview_bind(w, "myNativeFunc", my_binding_cb, w);
```
