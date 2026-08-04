# Security cards

Repository: `https://github.com/traefik/traefik#v3.7.10`
Category: configuration source integrity

## configuration source integrity

### Secure Key-Value Store Configuration Backend Access Controls

**Use when**

Configuring key-value stores such as Consul, Etcd, Redis, or ZooKeeper as dynamic configuration providers for Traefik.

**Secure rules**

**Rule 1: Restrict write access and use authenticated TLS connections for key-value store providers.**

Strictly restrict write access to the root key prefix using KV backend ACLs and authentication. Ensure Traefik runs with read-only permissions on the backend where supported, and avoid allowing untrusted network clients to modify KV store entries.

```yaml
providers:
  consul:
    endpoints:
      - "127.0.0.1:8500"
    rootKey: "traefik"
    token: "READ_ONLY_CONSUL_ACL_TOKEN"
    tls:
      ca: "/path/to/ca.crt"
      cert: "/path/to/client.crt"
      key: "/path/to/client.key"
```
