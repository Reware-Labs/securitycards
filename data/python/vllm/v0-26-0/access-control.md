# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`
Category: access control

## access control

### Enforce Restricted Local Media Path and Allowed Origin Boundaries

**Use when**

Configuring file access and cross-origin resource sharing for model inputs and server endpoints.

**Secure rules**

**Rule 1: Restrict local media file access to an explicitly designated root directory.**

When processing video inputs using codec backends, configure `allowed_local_media_path` to restrict file access to a specific root directory and supply absolute paths within that directory.

```python
from vllm.model_executor.models.llava_onevision2 import prepare_codec_video_input
valid_video_path = "/var/app/media/sample.mp4"
multi_modal_data = {
    "video": prepare_codec_video_input(valid_video_path)
}
```

**Rule 2: Explicitly list trusted origins when configuring CORS credentials**

Do not set `allow_origins` to a wildcard when `allow_credentials` is enabled in `CorsConfig` to prevent mirroring arbitrary request origins and unauthorized cross-origin access.

```python
let cors_config = CorsConfig {
    allow_origins: vec!["https://app.example.com".to_string()],
    allow_credentials: true,
    allow_methods: vec!["GET".to_string(), "POST".to_string()],
    allow_headers: vec!["authorization".to_string(), "content-type".to_string()],
};
let layer = cors_layer(&cors_config);
```
