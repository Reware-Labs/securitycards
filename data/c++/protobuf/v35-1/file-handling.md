# Security cards

Repository: `https://github.com/protocolbuffers/protobuf#v35.1`
Category: file handling

## file handling

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
