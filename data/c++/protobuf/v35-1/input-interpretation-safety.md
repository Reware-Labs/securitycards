# Security cards

Repository: `https://github.com/protocolbuffers/protobuf#v35.1`
Category: input interpretation safety

## input interpretation safety

### Safely Handle and Filter Unknown Fields in Protocol Buffers

**Use when**

Parsing, validating, and managing protocol buffer messages containing unknown fields across different language runtimes and parsers.

**Secure rules**

**Rule 1: Avoid relying on `MessageParser.WithDiscardUnknownFields` for JSON parsing**

Do not rely on `MessageParser.WithDiscardUnknownFields(bool)` to govern JSON deserialization because `ParseJson` relies on `JsonParser.Default`, which ignores `MessageParser`'s `DiscardUnknownFields` setting and results in silent policy bypass. Instead, explicitly configure a `JsonParser` instance with `JsonParser.Settings.Default.WithIgnoreUnknownFields(true)`.

```csharp
var jsonParser = new JsonParser(JsonParser.Settings.Default.WithIgnoreUnknownFields(true));
MyMessage message = jsonParser.Parse<MyMessage>(jsonString);
```

**Rule 2: Drop unknown fields recursively before crossing trust boundaries**

Calling `-clearUnknownFields` on an Objective-C protobuf message wipes unknown fields **only on that
instance**. Submessages, map values, repeated elements, and extensions still retain their
`unknownFields`, which can hide unvalidated data. Use the runtime helper
`GPBMessageDropUnknownFieldsRecursively()` to remove unknown fields from the entire message graph
before serialising, logging, or forwarding a message into another trust domain.

```objc
// Strip unknown fields from the entire message hierarchy
GPBMessageDropUnknownFieldsRecursively(message);
```

**Rule 3: Configure parsers explicitly to discard or handle unknown binary and text fields**

Configure `MessageParser<T>` with `WithDiscardUnknownFields(true)` when parsing binary Protobuf messages from untrusted networks where unknown payload fields should not be retained. When parsing text-format protocol buffer payloads, use `TextFormat.Parser` configured with `setAllowUnknownFields(true)` and `setAllowUnknownExtensions(true)`.

```csharp
MessageParser<MyMessage> parser = MyMessage.Parser.WithDiscardUnknownFields(true);
MyMessage message = parser.ParseFrom(incomingByteArray);
```

**Rule 4: Handle unknown fields with `skipField(int)` or `UnknownFieldSet`; avoid the deprecated output-skipping overload**

When manually parsing a wire stream via `CodedInputStream`, read each tag and:

* If it’s a field you recognise, process it with the appropriate `readXxx()` call.
* Otherwise **either** collect the raw data with `UnknownFieldSet.Builder.mergeFieldFrom(tag, input)` **or** discard it with `skipField(tag)`.
* **Do not** call the deprecated `skipField(tag, CodedOutputStream)` overload; the library recommends `UnknownFieldSet` for that purpose.

```java
byte[] data = ...;                         // incoming message bytes
CodedInputStream input = CodedInputStream.newInstance(data);
UnknownFieldSet.Builder unknown = UnknownFieldSet.newBuilder();

while (true) {
  int tag = input.readTag();
  if (tag == 0) break;                     // end-of-stream

  int fieldNum = WireFormat.getTagFieldNumber(tag);
  if (fieldNum == MY_KNOWN_FIELD) {
    int value = input.readInt32();         // consume known field
    handle(value);
  } else {
    unknown.mergeFieldFrom(tag, input);    // or: input.skipField(tag);
  }
}

UnknownFieldSet extras = unknown.build();  // inspect or ignore
```

**Rule 5: Explicitly handle unknown fields during security message comparisons**

When performing message comparisons, explicitly control whether unknown fields are evaluated or ignored. `MessageDifferencer::Equivalent()` automatically ignores unknown fields. For security-sensitive message equality checks, rely on `MessageDifferencer::Equals()` to ensure unparsed unknown fields are not silently ignored.

```cpp
bool are_equal = google::protobuf::util::MessageDifferencer::Equals(msg1, msg2);
```


### Validate UTF-8 string encodings and handle decoding exceptions during input parsing

**Use when**

Parsing string fields, text formats, or byte streams from untrusted sources where valid UTF-8 and character encoding must be enforced.

**Secure rules**

**Rule 1: Validate UTF-8 string encoding when converting or setting string fields from untrusted byte streams.**

Always ensure byte sequences are validated for UTF-8 compliance using methods like `ByteString.isValidUtf8()` or standard UTF-8 string conversion helpers before passing or setting data on string fields to prevent parsing failures or unexpected exceptions.

```java
ByteString payload = message.getPayloadBytes();
if (!payload.isValidUtf8()) {
  throw new IllegalArgumentException("Payload contains invalid or non-canonical UTF-8 data");
}
String text = payload.toStringUtf8();
```

**Rule 2: Catch Protobuf decode errors—including malformed UTF-8—when parsing untrusted data**

`Message.FromString()` may raise two distinct exceptions:

* **`UnicodeDecodeError`** – emitted by the pure-Python runtime when a *string* field contains invalid UTF-8.
* **`google.protobuf.message.DecodeError`** – raised for general wire-format problems (truncation, tag errors, etc.).

Always wrap deserialization of untrusted bytes and handle **both** exceptions to reject or log malformed inputs safely.

```python
from google.protobuf import message as _pb_message
from my_proto_pb2 import MyMessage

def parse_untrusted(buf: bytes) -> MyMessage:
    try:
        return MyMessage.FromString(buf)
    except (UnicodeDecodeError, _pb_message.DecodeError) as err:
        logger.warning("Invalid protobuf payload rejected: %s", err)
        raise ValueError("Bad protobuf payload") from err
```
