# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: cryptography

## cryptography

### Configure ActiveRecord Encryption Ciphers and Key Derivation Securely

**Use when**

When configuring ActiveRecord Encryption ciphers, key derivation parameters, and handling migration or decryption error workflows.

**Secure rules**

**Rule 1: Use non-deterministic encryption by default and avoid deterministic encryption unless database querying is required.**

Invoke `encrypts :attribute` on models using non-deterministic encryption by default to ensure unique initialization vectors are generated for every operation. Only enable `deterministic: true` when exact-match database queries are strictly necessary.

```ruby
class Article < ApplicationRecord
  encrypts :title
end

class Author < ApplicationRecord
  encrypts :email, deterministic: true
end
```

**Rule 2: Derive keys using ActiveSupport::KeyGenerator with cipher-compatible key lengths and strong digest algorithms.**

Ensure secret keys meet required key lengths for chosen ciphers by using `ActiveSupport::KeyGenerator` or `ActiveRecord::Encryption::KeyGenerator`. Configure strong digest classes such as `OpenSSL::Digest::SHA256`.

```ruby
ActiveRecord::Encryption.config.hash_digest_class = OpenSSL::Digest::SHA256
generator = ActiveRecord::Encryption::KeyGenerator.new
key = generator.generate_random_key
derived_key = generator.derive_key_from(secret_password)
```

**Rule 3: Configure previous encryption schemes for existing ciphertext**

When changing an encrypted attribute’s properties, declare its old properties with `previous`. Rails will try the current scheme and then compatible previous schemes when reading existing ciphertext. If every configured scheme fails, Rails raises `ActiveRecord::Encryption::Errors::Decryption`; the failure is not converted automatically to `nil`.

```ruby
class Article
  encrypts :title, deterministic: true, previous: { deterministic: false }
end
```


### Use Authenticated Message Encryptors and Purpose-Specific Verifiers

**Use when**

When generating cryptographic tokens, signing messages, or encrypting payload data with ActiveSupport message encryptors and verifiers.

**Secure rules**

**Rule 1: Use purpose-specific message verifiers to prevent token reuse across features.**

Pass a distinct, purpose-specific string name when requesting message verifiers via `Rails.application.message_verifier(verifier_name)` to prevent token replay attacks across different application features.

```ruby
token = Rails.application.message_verifier("password_reset").generate(user.id)
user_id = Rails.application.message_verifier("password_reset").verify(token)
```

**Rule 2: Handle ActiveSupport::MessageEncryptor::InvalidMessage exceptions during decryption.**

Rescue `ActiveSupport::MessageEncryptor::InvalidMessage` when decrypting messages to safely handle tampered ciphertexts, mismatched keys, or corrupted authentication tags.

```ruby
begin
  decrypted_payload = encryptor.decrypt_and_verify(user_supplied_message)
rescue ActiveSupport::MessageEncryptor::InvalidMessage
  nil
end
```
