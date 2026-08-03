# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`
Category: resource exhaustion

## resource exhaustion

### Configure Resource and Media Input Limits to Prevent Denial of Service

**Use when**

When configuring vLLM inference servers and processing media files, requests, or structured inputs that could cause resource exhaustion or out-of-memory errors.

**Secure rules**

**Rule 1: Enforce explicit media decode resource limits and avoid zero values in public environments**

Configure media decode resource limits such as `VLLM_MAX_IMAGE_PIXELS`, `VLLM_MAX_AUDIO_CLIP_FILESIZE_MB`, and `VLLM_MAX_AUDIO_DECODE_DURATION_S` to prevent decompression bombs and out-of-memory crashes.

```bash
export VLLM_MAX_IMAGE_PIXELS=178956970
export VLLM_MAX_AUDIO_CLIP_FILESIZE_MB=25
export VLLM_MAX_AUDIO_DECODE_DURATION_S=600
vllm serve mistralai/Pixtral-12B-2409
```

**Rule 2: Restrict maximum sequence generation count and batch concurrency parameters**

Cap request sequence parameters and environment variables like `VLLM_MAX_N_SEQUENCES` and configure scheduler limits to prevent excessive memory and execution time allocation.

```bash
export VLLM_MAX_N_SEQUENCES=64
vllm serve meta-llama/Llama-2-7b-chat-hf
```
