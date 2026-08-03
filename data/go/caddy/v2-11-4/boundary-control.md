# Security cards

Repository: `https://github.com/caddyserver/caddy#v2.11.4`
Category: boundary control

## boundary control

### Configure Trusted Proxies and Allowed Networks to Enforce Trust Boundaries

**Use when**

Configuring Caddy behind upstream load balancers, reverse proxies, or when accepting PROXY protocol connections from external sources.

**Secure rules**

**Rule 1: Explicitly define trusted proxy CIDRs before accepting forwarded headers.**

When deploying Caddy behind upstream proxies or load balancers, explicitly set `trusted_proxies` to specific IP addresses or CIDR ranges. By default, Caddy does not trust client-supplied headers and will drop or overwrite them unless the request originates from a configured trusted proxy.

```json
{
  "handler": "reverse_proxy",
  "trusted_proxies": ["10.0.0.0/8", "172.16.0.0/12"]
}
```

**Rule 2: Restrict PROXY protocol listener sources to trusted upstream networks.**

When configuring the `proxy_protocol` listener wrapper in Caddy to extract client connection metadata, explicitly restrict trusted proxy CIDRs using the `allow` property to prevent untrusted clients from injecting arbitrary PROXY headers and spoofing the remote client address.

```caddyfile
servers :9080 {
	listener_wrappers {
		proxy_protocol {
			timeout 5s
			allow 10.0.0.0/8 127.0.0.0/8
		}
	}
}
```
