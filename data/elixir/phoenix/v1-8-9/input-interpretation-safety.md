# Security cards

Repository: `https://github.com/phoenixframework/phoenix#v1.8.9`
Category: input interpretation safety

## input interpretation safety

### Access parameter origins explicitly to avoid parameter shadowing and parser discrepancies

**Use when**

Handling incoming request parameters in Phoenix controllers where distinct sources such as query parameters, path variables, and request bodies must be unambiguously separated.

**Secure rules**

**Rule 1: Read parameter sources explicitly using origin-specific connection accessors instead of relying on the merged params map.**

When an application depends on input coming specifically from the query string or the request body, avoid relying on the merged `params` map alone if parameter collisions could bypass logic. Instead, read parameter sources directly using `conn.path_params`, `conn.body_params`, or `conn.query_params` to prevent parameter shadowing.

```elixir
defmodule HelloWeb.HelloController do
  use HelloWeb, :controller

  def create(conn, _params) do
    payload = conn.body_params["url"]
    query_token = conn.query_params["token"]

    case Hello.Urls.create_url(payload, query_token) do
      {:ok, url} -> render(conn, :show, url: url)
      {:error, changeset} -> render(conn, :error, changeset: changeset)
    end
  end
end
```


### Prevent prototype pollution during object serialization

**Use when**

Serializing nested parameter objects or dynamic dictionaries into query strings or socket parameters where prototype properties might be enumerated.

**Secure rules**

**Rule 1: Check own-property ownership using Object.prototype.hasOwnProperty.call during object property enumeration.**

When iterating over enumerable properties using `for...in` loops on dynamic dictionaries or parameter objects, always verify that keys belong directly to the object by using `Object.prototype.hasOwnProperty.call(obj, key)`. This prevents prototype-polluted properties from being included in serialized request payloads.

```javascript
static serialize(obj, parentKey) {
  let queryStr = [];
  for (var key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      continue;
    }
    let paramKey = parentKey ? `${parentKey}[${key}]` : key;
    let paramVal = obj[key];
    if (typeof paramVal === "object" && paramVal !== null) {
      queryStr.push(this.serialize(paramVal, paramKey));
    } else {
      queryStr.push(encodeURIComponent(paramKey) + "=" + encodeURIComponent(paramVal));
    }
  }
  return queryStr.join("&");
}
```
