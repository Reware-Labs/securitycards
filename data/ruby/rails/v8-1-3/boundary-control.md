# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: boundary control

## boundary control

### Enforce explicit purpose checks when decrypting and verifying cryptographically signed messages

**Use when**

When handling cryptographically signed or encrypted tokens, messages, or session states across trust boundaries where payloads might be replayed or abused in unauthorized contexts.

**Secure rules**

**Rule 1: Attach a specific purpose and expiration constraints when encrypting and signing messages, and supply the matching purpose during decryption and verification.**

Always specify an explicit `:purpose` option and expiration constraints such as `:expires_in` when generating or encrypting signed messages. When verifying or decrypting, supply the matching `:purpose` to ensure tokens cannot be replayed across different endpoints or features.

```ruby
token = crypt.encrypt_and_sign(user_id, purpose: :login, expires_in: 15.minutes)
user_id = crypt.decrypt_and_verify(token, purpose: :login)
```

**Rule 2: Specify an explicit purpose option when generating and verifying signed messages with MessageVerifier.**

Always pass an explicit `:purpose` option when generating and verifying signed messages using `MessageVerifier`. This ensures signatures cannot be accepted across different feature contexts, protecting against signature replay and context confusion attacks.

```ruby
token = verifier.generate(user.id, purpose: :login)

# Verification succeeds only when matching purpose is supplied
user_id = verifier.verified(token, purpose: :login)
```
