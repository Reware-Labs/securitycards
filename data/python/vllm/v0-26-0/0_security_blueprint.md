# Security blueprint

Repository: `https://github.com/vllm-project/vllm#v0.26.0`

## Security posture

The vLLM framework assumes a security model where API endpoints, model weights, multimodal inputs, and distributed node communications require explicit hardening to prevent unauthorized access, resource exhaustion, and remote code execution. By default, unauthenticated server access, developer debug modes, and insecure serialization flags must be locked down in production environments. Developers must ensure that all user inputs, chat templates, request parameters, file paths, and peer protocols undergo strict schema validation and fail closed upon encountering unrecoverable violations.

## Essential implementation rules

1. **Enforce API Key Authentication and Disable Debug Endpoints**

Explicitly configure API key authentication using the `VLLM_API_KEY` environment variable or `--api-key` CLI argument for the OpenAI API server to prevent unauthenticated access. Ensure that developer mode `VLLM_SERVER_DEV_MODE` remains unset in production to disable high-risk administrative debug endpoints such as `/collective_rpc`.

2. **Restrict Local Media Path and CORS Origin Boundaries**

Configure `allowed_local_media_path` to restrict multimodal file access to an explicitly designated root directory and prevent path traversal. When configuring CORS policies, specify explicit trusted domain lists using `--allowed-origins` or configuration objects, and avoid wildcard origins when credentials are enabled.

3. **Validate Request Parameters, Token IDs, and Role Sequences**

Perform strict input validation on chat completion requests, verifying role sequences against generation flags such as `add_generation_prompt`, restricting `reasoning_effort` and other parameters to safe numeric or string ranges, and ensuring token ID arrays contain only non-negative integers within model vocabulary limits.

4. **Enforce Strict Input Interpretation and Sanitize Placeholders**

Sanitize user chat messages and prompts to reject internal reserved sentinel tokens and embedding placeholders like `<prompt_embeds>` and `<##IMAGE##>`. Validate tool call arguments as valid JSON objects and verify custom logits processor parameters within `validate_params` methods.

5. **Isolate Prefix Caching with Tenant Cache Salts**

Always populate the `cache_salt` field with a distinct tenant- or security-context-specific salt string in chat completion requests to ensure that prompt prefix structures do not reuse KV-cache states across unauthorized tenant boundaries.

6. **Keep Insecure Serialization Flags Disabled**

Ensure that the `VLLM_ALLOW_INSECURE_SERIALIZATION` environment variable remains explicitly disabled or set to `0` to prevent arbitrary object deserialization and remote code execution vulnerabilities in production and untrusted environments.

7. **Use Authenticated Encryption for Tensorizer Model Serialization**

Supply an encryption keyfile via `encryption_keyfile` in `TensorizerConfig` when saving or loading model weights and LoRA adapters using Tensorizer, ensuring `libsodium` is installed to support encrypted tensor operations.

8. **Protect Secrets and Load Cloud Credentials via Environment Variables**

Load Hugging Face access tokens (`HF_TOKEN`), S3 storage credentials (`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`), and API keys via environment variables or secure container secret managers rather than hardcoding them into source files, CLI arguments, or plain configuration strings.

9. **Enforce TLS Verification and Encrypted Network Connections**

Verify server certificates and enforce TLS encryption across external and distributed data parallel communication endpoints by providing SSL certificate paths such as `ssl_keyfile`, `ssl_certfile`, and `ssl_ca_certs`.

10. **Configure Resource and Media Input Limits to Prevent Denial of Service**

Set explicit media decode resource limits such as `VLLM_MAX_IMAGE_PIXELS`, `VLLM_MAX_AUDIO_CLIP_FILESIZE_MB`, and `VLLM_MAX_AUDIO_DECODE_DURATION_S`, and cap maximum sequence generation counts using `VLLM_MAX_N_SEQUENCES` to prevent decompression bombs and out-of-memory crashes.

11. **Terminate P2P Sessions Instantly on Protocol Validation Failures**

Perform strict field checks within control message handlers for P2P offloading and explicitly raise a `ValueError` upon encountering malformed data to trigger immediate connection termination and prevent fault state loops.
