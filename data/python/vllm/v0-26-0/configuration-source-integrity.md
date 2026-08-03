# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`
Category: configuration source integrity

## configuration source integrity

### Enforce Strict Validation and Trusted Sources for Configuration and Middleware

**Use when**

Setting up server configurations, YAML files, environment variables, and deployment scripts for vLLM services.

**Secure rules**

**Rule 1: Validate compilation options and server parameters against strict schema constraints using trusted configuration parsers.**

Ensure configuration files use supported formats and validate compilation options against defined Pydantic schema constraints using FlexibleArgumentParser to prevent server execution in an improperly configured state.

```python
from pydantic import ValidationError
from vllm.config.compilation import CompilationConfig
from vllm.utils.argparse_utils import FlexibleArgumentParser

parser = FlexibleArgumentParser()
parser.add_argument('serve')
parser.add_argument('model_tag', nargs='?')
parser.add_argument('--config', type=str)

try:
    args = parser.parse_args(['serve', 'my-model', '--config', 'config.yaml'])
except ValueError as err:
    print(f'Configuration file error: {err}')

try:
    comp_config = CompilationConfig(mode='VLLM_COMPILE')
except ValidationError as err:
    print(f'Invalid compilation configuration: {err}')
```
