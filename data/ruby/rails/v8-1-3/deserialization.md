# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: deserialization

## deserialization

### Configure Safe Deserializers and Serializers for Messages, Cryptographic Signatures, and Cookies

**Use when**

When configuring session cookies, message encryptors, message verifiers, or cryptographic serializers to handle untrusted data and prevent arbitrary object instantiation or execution.

**Secure rules**

**Rule 1: Use non-Marshal serializers such as JSON or MessagePack for application cookies.**

Configure `config.action_dispatch.cookies_serializer` to `:json` rather than `:marshal` when setting up session and cookie stores across the application to restrict deserialization to primitive data structures.

```ruby
# config/application.rb
Rails.application.configure do
  config.action_dispatch.use_authenticated_cookie_encryption = true
  config.action_dispatch.cookies_serializer = :json
end
```

**Rule 2: Avoid Ruby Marshal serializers in MessageEncryptor to prevent arbitrary code execution.**

Explicitly pass a non-Marshal serializer option such as `:json` or `:message_pack` when initializing `ActiveSupport::MessageEncryptor` and avoid using `:marshal`, `:json_allow_marshal`, or `:message_pack_allow_marshal`.

```ruby
crypt = ActiveSupport::MessageEncryptor.new(
  secret_key,
  cipher: "aes-256-gcm",
  serializer: :json
)
```

**Rule 3: Use ActiveRecord Encryption MessageSerializer for safe message parsing.**

Use `ActiveRecord::Encryption::MessageSerializer` for parsing serialized message data instead of unsafe JSON parsing methods like `JSON.load` to safely parse payloads without allowing arbitrary class instantiation via `json_class` payload directives.

```ruby
serializer = ActiveRecord::Encryption::MessageSerializer.new
message = ActiveRecord::Encryption::Message.new(payload: "sensitive data")
serialized = serializer.dump(message)

deserialized = serializer.load(serialized)
```

**Rule 4: Configure MessageVerifier to use non-Marshal serializers.**

Instantiate `ActiveSupport::MessageVerifier` using secure non-Marshal serializers such as `:json` or `:message_pack` instead of serializers supporting Ruby Marshal deserialization.

```ruby
verifier = ActiveSupport::MessageVerifier.new(secret, digest: "SHA256", serializer: :json)
```
