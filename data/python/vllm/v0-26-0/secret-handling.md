# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`
Category: secret handling

## secret handling

### Protect API Tokens and Credentials in Execution Environments

**Use when**

Setting up Hugging Face tokens, OpenAI API keys, and server authorization credentials for benchmark runners and API servers.

**Secure rules**

**Rule 1: Protect Hugging Face access tokens in environment variables or container secrets.**

When fetching gated or private datasets or models, ensure credentials are automatically read from environment variables like `HF_TOKEN` rather than being hardcoded.

```bash
export HF_TOKEN="hf_your_access_token_here"
```


### Secure Cloud Storage and Model Loader Credentials

**Use when**

Configuring cloud storage credentials, tensorizer URIs, or KV cache offloading destinations for vLLM models.

**Secure rules**

**Rule 1: Load S3 access keys and secrets via environment variables instead of hardcoding them into source files or configuration options.**

Avoid hardcoding sensitive credentials such as access keys or secret keys in source code or configuration files. Rely on environment variables like `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` or secure key files.

```python
import os
from vllm.model_executor.model_loader.tensorizer import TensorizerConfig

config = TensorizerConfig(
    tensorizer_uri="s3://my-bucket/model.tensors",
    encryption_keyfile="/secrets/tensor_key.bin",
    s3_access_key_id=os.getenv("S3_ACCESS_KEY_ID"),
    s3_secret_access_key=os.getenv("S3_SECRET_ACCESS_KEY"),
)
```

**Rule 2: Avoid embedding explicit cloud credentials in server arguments or CLI configurations.**

Do not embed explicit cloud credentials directly in command-line arguments or plain JSON configuration strings. Leave credential fields empty to rely on IAM roles, workload identity, or environment variables.

```bash
vllm serve <model> \
  --kv-transfer-config '{
    "kv_connector": "OffloadingConnector",
    "kv_role": "kv_both",
    "kv_connector_extra_config": {
      "spec_name": "TieringOffloadingSpec",
      "cpu_bytes_to_use": 10737418240,
      "secondary_tiers": [
        {
          "type": "obj",
          "store_config": {
            "bucket": "my-kv-cache-bucket",
            "endpoint_override": "s3.us-west-2.amazonaws.com",
            "scheme": "https"
          }
        }
      ]
    }
  }'
```

**Rule 3: Inject API keys and cloud storage secrets using container environment secret managers.**

Pass sensitive credentials such as `VLLM_API_KEY`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY` from environment variables without committing them to source control, container images, or shell histories.

```bash
docker run -e VLLM_API_KEY="$SECURE_VLLM_API_KEY" \
           -e S3_ACCESS_KEY_ID="$SECURE_S3_KEY" \
           -e S3_SECRET_ACCESS_KEY="$SECURE_S3_SECRET" \
           vllm/vllm-openai:latest
```
