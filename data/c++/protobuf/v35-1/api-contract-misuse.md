# Security cards

Repository: `https://github.com/protocolbuffers/protobuf#v35.1`
Category: api contract misuse

## api contract misuse

### Use safe copy and validation methods for ByteString and collection fields

**Use when**

Constructing message components, managing byte buffers, and populating repeated or map fields.

**Secure rules**

**Rule 1: Use copyFrom to create ByteString instances from mutable buffers**

Always use `ByteString.copyFrom()` when creating a ByteString from an existing byte array or ByteBuffer to enforce defensive copying and preserve data immutability.

```java
byte[] buffer = getDynamicData();
ByteString safeByteString = ByteString.copyFrom(buffer);
Arrays.fill(buffer, (byte) 0);
```

**Rule 2: Sanitize collections to exclude null values before populating repeated fields**

Filter or sanitize external inputs to ensure no null elements are added to `RepeatedField<T>` instances, avoiding immediate runtime exceptions.

```csharp
var nonNullItems = rawItems.Where(x => x != null);
myMessage.Items.AddRange(nonNullItems);
```


### Validate token parsing inputs and check tokenizer status

**Use when**

Parsing tokenized streams and evaluating text inputs using tokenizer helper routines.

**Secure rules**

**Rule 1: Check upb_Status after tokenizer iteration completes to detect errors**

Always provide a `upb_Status` object when tokenizing text input and verify `upb_Status_IsOk` upon loop termination to distinguish a clean end-of-file from malformed input errors.

```c
upb_Status status;
upb_Status_Clear(&status);
while (upb_Tokenizer_Next(tokenizer, &status)) {
  // Process tokens
}
if (!upb_Status_IsOk(&status)) {
  // Handle parsing failure
}
```

**Rule 2: Validate token types before calling static parser helpers**

Ensure input strings originate from tokens parsed with matching token types before invoking static parsing helper functions to prevent assertion failures and undefined behavior.

```cpp
google::protobuf::io::Tokenizer tokenizer(&stream, &collector);
if (tokenizer.Next() && tokenizer.current().type == google::protobuf::io::Tokenizer::TYPE_STRING) {
  std::string parsed;
  google::protobuf::io::Tokenizer::ParseString(tokenizer.current().text, &parsed);
}
```
