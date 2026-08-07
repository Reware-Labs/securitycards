# Security cards

Repository: `https://github.com/protocolbuffers/protobuf#v35.1`
Category: cryptography

## cryptography

### Compute Full Cryptographic Digests on Serialized Messages Instead of Message Hash

**Use when**

Serializing Protobuf messages and computing integrity verification, checksums, or signatures over the payload.

**Secure rules**

**Rule 1: Do not rely on the Ruby Protobuf Message#hash method for cryptographic integrity or checksums.**

The JRuby implementation of `Message#hash` truncates outputs and is intended only for hash table placement. Instead, serialize the Protobuf message to a binary byte string using `encode` and compute a full cryptographic digest over the serialized payload using Ruby's `Digest` library.

```ruby
serialized_data = MyMessage.encode(msg)
sha256_digest = Digest::SHA256.digest(serialized_data)
```
