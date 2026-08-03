# Security cards

Repository: `https://github.com/run-llama/llama_index#v0.14.23`
Category: file handling

## file handling

### Validate Local Target Paths and Constrain File Access

**Use when**

When accepting local file paths or destination paths from user input or remote tools that interact with the local filesystem, code interpreter downloads, or document parsing blocks.

**Secure rules**

**Rule 1: Resolve and constrain local file paths to a designated safe directory before performing read or write operations.**

Always resolve paths using `pathlib.Path.resolve()` and verify that the target path remains within an authorized base directory to prevent path traversal, arbitrary file reads, and file overwrite vulnerabilities.

```python
from pathlib import Path
from llama_index.core.base.llms.types import ChatMessage, DocumentBlock, MessageRole, TextBlock

def create_safe_doc_message(user_supplied_path: str, allowed_dir: Path) -> ChatMessage:
    target_path = Path(user_supplied_path).resolve()
    if not target_path.is_relative_to(allowed_dir.resolve()):
        raise ValueError("Unauthorized file path access attempt.")
    return ChatMessage(
        role=MessageRole.USER,
        blocks=[
            DocumentBlock(path=target_path),
            TextBlock(text="Please analyze this document."),
        ]
    )
```
