# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: authentication

## authentication

### Authenticate Clients Using Mutual TLS and Certificate Guards

**Use when**

When implementing transport-layer client identity verification and requiring valid cryptographic certificates for endpoint access.

**Secure rules**

**Rule 1: Mandate client certificate verification using Rocket mTLS configuration features**

Enable Rocket’s mtls dependency feature in Cargo.toml. Configure trusted CA certificates and mandatory = true separately in Rocket.toml.

```toml
[dependencies]
rocket = { version = "0.5.1", features = ["mtls"] }

[default.tls.mutual]
ca_certs = "path/to/ca_certs.pem"
mandatory = true
```

**Rule 2: Validate certificate guard outcomes securely within route handlers.**

Use `rocket::mtls::Certificate` request guards to enforce valid certificate chains, or handle custom `mtls::Result` variants explicitly to prevent unauthenticated access.

```rust
use rocket::mtls::{self, Certificate};

#[get("/protected")]
fn protected(cert: Certificate<'_>) {
    // Handler executes only when a valid client certificate was supplied.
}

#[get("/custom-check")]
fn custom_check(cert: mtls::Result<Certificate<'_>>) -> Result<String, &'static str> {
    match cert {
        Ok(valid_cert) => Ok(format!("Authenticated serial: {:?}", valid_cert.serial())),
        Err(_) => Err("Invalid client certificate presented"),
    }
}
```

**Rule 3: Inspect the leaf certificate in peer certificate chains during authentication**

Use Rocket’s public mtls::Certificate request guard, which exposes the validated leaf certificate, and authorize the client by checking expected subject, SAN, or serial-number values. Do not treat a nonempty raw certificate blob as proof of an authorized identity.

```rust
use rocket::http::private::Connection;

fn verify_client<C: Connection>(conn: &C) -> bool {
    if let Some(certs) = conn.peer_certificates() {
        if let Some(chain) = certs.chain_data() {
            if let Some(peer_cert) = chain.first() {
                return !peer_cert.0.is_empty();
            }
        }
    }
    false
}
```
