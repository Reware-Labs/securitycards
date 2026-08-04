# Security cards

Repository: `https://github.com/ollama/ollama#v0.32.5`
Category: deserialization

## deserialization

### Validate Model File Formats, Headers, and Metadata Prior to Deserialization

**Use when**

Use when loading, parsing, or creating model files from untrusted user inputs or local paths in Ollama model workflows.

**Secure rules**

**Rule 1: Enforce strict format validation, MIME type checks, and content-type detection on model files before invoking deserialization or parsing backends.**

Validate model file extensions and MIME content types before allowing model backends to load them. Prioritize safe serialization formats such as Safetensors and GGUF, which do not support executable code. If legacy PyTorch model formats are allowed, enforce strict content-type detection to ensure conformity and prevent loading arbitrary or unverified serialized streams.

```go
files, err := filesForModel(modelDirPath)
if err != nil {
    return nil, fmt.Errorf("failed to validate model file formats: %w", err)
}
```

**Rule 2: Validate GGUF and Safetensors headers, shapes, and metadata boundaries before decoding binary weight payloads**

When parsing Safetensors model weight files, decode metadata using safe JSON parsers rather than executable object deserializers, and validate tensor headers, shapes, and offset bounds. Ensure metadata type constraints and structures are verified to prevent out-of-bounds access, type confusion, or unexpected behavior.

```go
var n int64
if err := binary.Read(f, binary.LittleEndian, &n); err != nil {
    return nil, err
}

info, err := f.Stat()
if err != nil { return nil, err }
const maxSafetensorsHeaderSize int64 = 100 << 20
if n < 0 || n > maxSafetensorsHeaderSize || info.Size() < 8 || n > info.Size()-8 {
    return nil, fmt.Errorf("invalid safetensors header length: %d", n)
}
b := bytes.NewBuffer(make([]byte, 0, n))
if _, err = io.CopyN(b, f, n); err != nil {
    return nil, err
}

var headers map[string]safetensorMetadata
if err := json.NewDecoder(b).Decode(&headers); err != nil {
    return nil, err
}
```
