# Security cards

Repository: `https://github.com/sgl-project/sglang#v0.5.16`
Category: network boundary

## network boundary

### Restrict Router Host Binding and Enforce Transport-Layer Security

**Use when**

Deploying the SGLang model gateway, router, or worker services in production environments where network trust boundaries must be enforced.

**Secure rules**

**Rule 1: Bind the router and model server host to private interfaces or local loopback addresses rather than exposing them on unconstrained network interfaces.**

Avoid binding network services to `0.0.0.0` by default. Explicitly configure the host parameter to a loopback address like `127.0.0.1` or a private internal IP address to prevent unauthorized external access when public exposure is not required.

```python
args = RouterArgs(
    host="127.0.0.1",
    port=30000,
)
```

**Rule 2: Configure TLS server certificates and mutual authentication for router and gateway communications.**

Enable transport-layer security by supplying server certificate paths, private keys, and client certificate authorities using configuration parameters such as `server_cert_path` and `server_key_path` to prevent traffic interception and peer impersonation.

```python
args = RouterArgs(
    host="127.0.0.1",
    port=30000,
    server_cert_path="/etc/ssl/certs/router_server.crt",
    server_key_path="/etc/ssl/private/router_server.key",
    client_cert_path="/etc/ssl/certs/router_client.crt",
    client_key_path="/etc/ssl/private/router_client.key",
    ca_cert_paths=["/etc/ssl/certs/ca.crt"],
)
```


### Validate Disaggregation Endpoints and Isolate Internal Communication Channels

**Use when**

Configuring distributed prefill-decode disaggregation, ZeroMQ endpoints, or peer-to-peer data transfer channels across SGLang instances.

**Secure rules**

**Rule 1: Isolate disaggregated scheduler and ZeroMQ communication channels to loopback or private network interfaces.**

Bind scheduling endpoints and peer-to-peer hostnames such as `pool_work_endpoint` and `disagg_p2p_hostname` strictly to local loopback addresses or isolated internal networks to prevent unauthorized external entities from injecting tasks or intercepting tensor buffers.

```python
server_args.pool_work_endpoint = "tcp://127.0.0.1:5555"
server_args.pool_result_endpoint = "tcp://127.0.0.1:5556"
server_args.disagg_p2p_hostname = "127.0.0.1"
```

**Rule 2: Have the model gateway overwrite client-supplied bootstrap parameters**

Route untrusted PD traffic through the SGLang model gateway, which overwrites `bootstrap_host`, `bootstrap_port`, and `bootstrap_room` using the selected prefill worker; do not expose decode endpoints directly to untrusted clients.

```python
from sglang_router import Router, RouterArgs

args = RouterArgs(
    pd_disaggregation=True,
    prefill_urls=[("http://prefill:30000", 8998)],
    decode_urls=["http://decode:30000"],
)
router = Router.from_args(args)
```
