# Security cards

Repository: `https://github.com/protocolbuffers/protobuf#v35.1`

## Category: api contract misuse

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


## Category: boundary control

### Restrict Descriptor Pools When Parsing Messages Containing Any Types

**Use when**

Parsing or converting messages containing `google.protobuf.Any` types using text format functions in Python.

**Secure rules**

**Rule 1: Provide an isolated descriptor pool when parsing or converting messages containing google.protobuf.Any types.**

Explicitly pass an isolated descriptor_pool instance to text_format functions when processing messages containing google.protobuf.Any types to prevent falling back to the default global descriptor pool which exposes all globally registered protobuf message descriptors.

```python
from google.protobuf import descriptor_pool, text_format
from myproject_pb2 import MyMessage

isolated_pool = descriptor_pool.DescriptorPool()
isolated_pool.AddDescriptor(MyMessage.DESCRIPTOR)

def safe_message_to_string(message) -> str:
    return text_format.MessageToString(message, descriptor_pool=isolated_pool)
```


## Category: configuration source integrity

### Sanitize Environment Variables for Code Generator Configuration Sources

**Use when**

Configuring protocol buffer code generators in automated or multi-tenant build environments that read options from environment variables.

**Secure rules**

**Rule 1: Clear untrusted Objective-C generator environment variables before invoking `protoc`**

The Objective-C code generator (`--objc_out`) in **Protobuf v35.1** changes its behaviour based on environment variables. Inherited or attacker-supplied values can suppress output or make the compiler read arbitrary paths:

* `GPB_OBJC_SKIP_IMPLS_FILE` – absolute path to a file whose contents tell the generator which `.proto` implementations to skip.
* `GPB_OBJC_HEADERS_ONLY` – if present, the generator emits headers only and omits `.m` sources.

Always launch `protoc` with these variables **unset** or set to trusted, validated values. Prefer deterministic `--objc_opt` parameters instead of environment variables whenever possible.

```cpp
// Sanitize environment before spawning protoc
unsetenv("GPB_OBJC_SKIP_IMPLS_FILE");
unsetenv("GPB_OBJC_HEADERS_ONLY");

// (Optional) provide a vetted allow-list instead of inheriting an unknown path.
setenv("GPB_OBJC_SKIP_IMPLS_FILE",
       "/build/proto/skip_impls_allowlist.txt",
       /*overwrite=*/1);

// execve("protoc", argv, environ);
```


## Category: cryptography

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


## Category: deserialization

### Configure Explicit Type Registries and Extension Registries for Deserializing Any and Extension Fields

**Use when**

Deserializing Protocol Buffer messages containing `google.protobuf.Any` fields or custom extension fields from untrusted inputs.

**Secure rules**

**Rule 1: Explicitly define allowed types using a `TypeRegistry` when parsing messages with `google.protobuf.Any` fields.**

Supply a properly scoped `TypeRegistry` via `usingTypeRegistry(TypeRegistry)` when configuring `JsonFormat.Parser` to prevent arbitrary or unexpected type URL resolution.

```java
TypeRegistry registry = TypeRegistry.newBuilder()
    .add(AllowedPayloadMessage.getDescriptor())
    .build();

JsonFormat.Parser parser = JsonFormat.parser()
    .usingTypeRegistry(registry);
```

**Rule 2: Provide an explicit `ExtensionRegistry` containing only expected extensions during message parsing.**

Construct an explicit `ExtensionRegistry` and populate it solely with permitted extensions for each parsing context, avoiding global or implicit auto-registration to prevent untrusted type injection.

```java
ExtensionRegistry registry = ExtensionRegistry.newInstance();
registry.add(MyProto.barExtension);
MyProto.Foo message = MyProto.Foo.parseFrom(inputBytes, registry);
```


## Category: file handling

### Prevent Path Traversal and Enforce Output Directory Containment

**Use when**

When configuring `CommandLineInterface` or `DiskSourceTree` to compile protocol buffer files and manage output or import paths.

**Secure rules**

**Rule 1: Enforce path traversal checks and reject output filenames containing relative path components.**

Avoid passing `--unsafe_allow_out_dir_escape` or enabling directory escape flags when invoking `CommandLineInterface` to ensure output files do not overwrite files outside the target directory.

```cpp
google::protobuf::compiler::CommandLineInterface cli;
// Ensure CLI invocation relies on default path traversal checks
const char* args[] = {"protoc", "--cpp_out=./generated", "input.proto"};
int result = cli.Run(3, args);
```

**Rule 2: Canonicalize and restrict virtual import paths to prevent filesystem traversal.**

Map explicit base directories using `DiskSourceTree::MapPath` and ensure imported filenames are clean relative paths free from parent directory references like '..'.

```cpp
google::protobuf::compiler::DiskSourceTree source_tree;
source_tree.MapPath("", "/safe/path/to/proto/imports");

google::protobuf::compiler::Importer importer(&source_tree, error_collector);
const google::protobuf::FileDescriptor* descriptor = importer.Import("service/messages.proto");
```


## Category: input contract definition

### Enforce Required Fields and Valid Input Structures During Parsing

**Use when**

Parsing text format strings or constructing protocol buffer messages from external input where required fields and valid contracts must be enforced.

**Secure rules**

**Rule 1: Use strict parsing methods to reject uninitialized messages with missing required fields.**

When constructing messages from text format strings, invoke `TextFormat.parse()` rather than raw `TextFormat.merge()` to ensure that any missing required fields trigger an `UninitializedMessageException` during parsing so that malformed input is properly rejected.

```java
try {
  MyMessage message = TextFormat.parse(textInput, MyMessage.class);
} catch (UninitializedMessageException e) {
  // Reject input with missing required fields
}
```

**Rule 2: Validate keys and values against null constraints before populating map builder fields.**

Protocol Buffer Lite map builder methods enforce strict non-null contracts for map keys and values. Explicitly check that keys and values are not null before invoking `put*` or `putAll*` operations to prevent unhandled `NullPointerException` errors from malformed or missing input data.

```java
if (key != null && value != null) {
  builder.putInt32ToStringField(key, value);
}
```


## Category: input interpretation safety

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


## Category: memory safety

### Synchronize Thread Lifecycles and Validate Alignment When Managing Arena Memory

**Use when**

Developing multi-threaded Protobuf applications that utilize custom arena block allocators or coordinate arena destruction and resets across multiple threads.

**Secure rules**

**Rule 1: Ensure custom arena block allocators maintain strict memory alignment and handle allocation and deallocation symmetrically.**

When configuring custom block allocation routines via `ArenaOptions` or `AllocationPolicy`, guarantee that `block_alloc` returns correctly aligned memory matching system alignment requirements and safely handles allocation failures. Custom deallocation functions must symmetrically release memory provided by `block_alloc` without causing double-freeing or memory leaks.

```cpp
void* CustomBlockAlloc(size_t size) {
  void* ptr = nullptr;
  if (posix_memalign(&ptr, alignof(std::max_align_t), size) != 0) {
    return nullptr;
  }
  return ptr;
}

void CustomBlockDealloc(void* ptr, size_t size) {
  free(ptr);
}
```

**Rule 2: Synchronize thread completion before destroying or resetting arenas.**

Ensure proper lifecycle synchronization when resetting or destroying arenas containing active objects or multi-threaded allocations. Join all worker threads that perform allocations on the `Arena` before destroying or resetting the arena to prevent memory corruption and use-after-free vulnerabilities.

```cpp
google::protobuf::Arena arena;
std::vector<std::thread> workers;
for (int i = 0; i < 4; ++i) {
  workers.emplace_back([&arena]() {
    auto* msg = google::protobuf::Arena::Create<MyMessage>(&arena);
  });
}
for (auto& worker : workers) {
  worker.join();
}
```


## Category: output encoding

### Escape Untrusted Text Properly for Output Contexts

**Use when**

Rendering serialized Protocol Buffer text format output or handling external display contexts.

**Secure rules**

**Rule 1: Do not embed raw Protobuf Text Format output directly in user-facing contexts**

`TextFormat` is intended for **debugging and human inspection only**. Its built-in escaper covers just a handful of control-character and quote escapes, leaving HTML/JS/Shell-significant characters untouched. When you *must* surface a Text Format string (for example, on an admin web page), treat it as untrusted plain text and apply a context-appropriate encoder first.

```java
import com.google.protobuf.TextFormat;
import my.proto.Messages.MyMessage;

// Produce the text representation (debug use).
String protoText = TextFormat.printer().printToString(myMessage);

// Minimal HTML-escaping before writing to a page.
String safeHtml = protoText
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;");

response.getWriter().write(safeHtml);
```


## Category: resource exhaustion

### Enforce Input Size, Recursion, and Descriptor Limits to Prevent Resource Exhaustion

**Use when**

Parsing, deserializing, or processing untrusted binary, JSON, text format, or descriptor payloads across various Protocol Buffers language runtimes.

**Secure rules**

**Rule 1: Enforce strict recursion depth limits when parsing untrusted text-format inputs.**

When parsing untrusted ASCII text-format protocol buffer payloads, use `TextFormat::Parser` and configure safe recursion limits via `SetRecursionLimit()` to restrict maximum nesting depth and prevent stack overflow crashes.

```cpp
google::protobuf::TextFormat::Parser parser;
parser.SetRecursionLimit(100);
MyMessage message;
if (!parser.Parse(input_stream, &message)) {
  // Handle parsing failure
}
```

**Rule 2: Configure explicit recursion depth limits during JSON deserialization.**

When deserializing JSON payloads using `JsonParser` or `JsonFormat.Parser`, enforce reasonable recursion depth limits using custom settings to prevent unbounded stack allocation and denial-of-service conditions.

```csharp
var settings = JsonParser.Settings.Default.WithRecursionLimit(64);
var parser = new JsonParser(settings);
MyMessage message = parser.Parse<MyMessage>(untrustedJsonString);
```

**Rule 3: Set explicit input size limits on CodedInputStream instances.**

Configure size limits on `CodedInputStream` via `setSizeLimit()` when reading data from untrusted network sources or files to prevent large payload allocations and `OutOfMemoryError`.

```java
CodedInputStream stream = CodedInputStream.newInstance(inputStream);
stream.setSizeLimit(64 * 1024 * 1024);
```

**Rule 4: Instantiate `Arena` with a defensive `ArenaOptions` when parsing untrusted data**

`Arena` will keep requesting new memory blocks as needed, so give it *tight but reasonable* block-size parameters and (optionally) a quota-enforcing allocator:

```cpp
// Defensive options: small first block, capped growth, custom allocator.
google::protobuf::ArenaOptions opts;
opts.start_block_size = 1024;              // 1 KiB first block
opts.max_block_size   = 64 * 1024;         // 64 KiB per additional block

// Example allocator that aborts once the process-wide quota is exceeded.
void* SafeAlloc(size_t n) {
  static std::atomic<size_t> used{0};
  const size_t kQuota = 10 * 1024 * 1024;   // 10 MiB
  if (used + n > kQuota) std::abort();
  used += n;
  return std::malloc(n);
}
void SafeFree(void* p, size_t n) {
  std::free(p);
  used -= n;
}
opts.block_alloc   = &SafeAlloc;
opts.block_dealloc = &SafeFree;

google::protobuf::Arena arena(opts);        // use this arena for parsing
```


## Category: secret handling

### Redact Sensitive Data During Protobuf Message Formatting

**Use when**

Logging, printing, or stringifying protobuf messages that contain sensitive credentials, tokens, or personal data.

**Secure rules**

**Rule 1: Enable safe debug formatting and redaction when converting sensitive protobuf messages to strings for logs or diagnostics.**

Use built-in debug formatting options such as `TextFormat.debugFormatPrinter()` or configure custom printers with `SetRedactDebugString(true)` to ensure fields marked with `debug_redact=true` in the proto schema are replaced with redaction markers instead of exposing plaintext secrets in logs.

```java
String debugString = TextFormat.debugFormatPrinter().printToString(message);
System.out.println(debugString);
```


## Category: security control integrity

### Regenerate Outdated Protobuf Code and Enforce Strict Startup Failure

**Use when**

Compiling protocol buffer definitions and launching applications that consume generated message code to ensure that obsolete legacy gencode fails securely on startup.

**Secure rules**

**Rule 1: Fail closed during startup when obsolete generated code is detected by configuring explicit error flags.**

Protobuf runtime detects obsolete generated code calling `makeExtensionsImmutable()`, which can lead to denial of service vulnerabilities. Developers must recompile all `.proto` files using modern compiler versions and pass the system property `-Dcom.google.protobuf.error_on_unsafe_pre22_gencode=true` to fail explicitly rather than allowing vulnerable legacy code to execute.

```bash
java -Dcom.google.protobuf.error_on_unsafe_pre22_gencode=true -jar myapplication.jar
```
