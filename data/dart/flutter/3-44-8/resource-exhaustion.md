# Security cards

Repository: `https://github.com/flutter/flutter#3.44.8`
Category: resource exhaustion

## resource exhaustion

### Enforce Image Decoding Dimension Limits to Prevent Resource Exhaustion

**Use when**

Decoding large or user-supplied image assets into memory where unbounded bitmap allocations can cause out-of-memory crashes.

**Secure rules**

**Rule 1: Wrap image providers with ResizeImage to restrict decoded bitmap dimensions.**

Use `ResizeImage` or `ResizeImage.resizeIfNeeded` to decode image assets at target display dimensions instead of native pixel resolution. Ensure `allowUpscaling` remains set to false by default to downscale high-resolution images while preventing small images from allocating oversized bitmap buffers.

```dart
final ImageProvider resizedProvider = ResizeImage.resizeIfNeeded(
  200,
  200,
  NetworkImage('https://example.com/large_image.jpg'),
  policy: ResizeImagePolicy.fit,
);
```
