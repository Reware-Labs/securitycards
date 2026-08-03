# Security cards

Repository: `https://github.com/run-llama/llama_index#v0.14.23`
Category: access control

## access control

### Enforce Ownership and Authorization Checks on Document and Chat Storage

**Use when**

When building retrieval-augmented generation apps or chat storage workflows that load indexes, vectors, or chat histories based on user-supplied parameters.

**Secure rules**

**Rule 1: Validate user ownership and permissions before loading document indexes or chat storage entries.**

Always verify that the authenticated user or API key has explicit permissions to access a specific collection or index object before invoking loading methods. Similarly, map and validate that session IDs belong to the current user before constructing storage keys for `SQLAlchemyChatStore` operations.

```python
collection = await Collection.objects.aget(id=collection_id, api_key=request_api_key)
index = VectorStoreIndex.load_from_disk(cache_file_path)
```
