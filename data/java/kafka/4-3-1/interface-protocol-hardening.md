# Security cards

Repository: `https://github.com/apache/kafka#4.3.1`
Category: interface protocol hardening

## interface protocol hardening

### Validate API keys and enforce protocol framing during authentication

**Use when**

Developing or configuring Kafka custom transport layers, network handlers, or protocol authentication mechanisms where incoming request headers and API keys must be strictly verified.

**Secure rules**

**Rule 1: Reject unexpected request types and invalid API keys during SASL handshake.**

Ensure that custom transport or protocol handlers fail fast on unexpected API keys prior to authentication completion rather than attempting to parse unauthenticated payload data. Kafka ensures that non-SASL or invalid API requests received during SASL authentication immediately trigger an `InvalidRequestException` without reading past the header.
