# Security cards

Repository: `https://github.com/fastapi/fastapi#0.139.2`
Category: dangerous execution

## dangerous execution

### Evaluate request-supplied expressions with a restricted parser

**Use when**

A route accepts a formula, filter, rule, or other expression as text and computes a result from it.

**Secure rules**

**Rule 1: Do not pass request data to `eval`, `exec`, or `compile`.**

These give the caller the full language, and restricting `globals` or `__builtins__` does not contain it — such namespaces are routinely escaped through attribute chains on ordinary objects. Parse the text with `ast.parse(mode="eval")`, walk the tree, and reject any node type outside an explicit allowlist before computing the result yourself. `ast.literal_eval` is not a substitute: it accepts only literals and `+`/`-` on numeric constants.

```python
import ast
import operator
from fastapi import FastAPI, HTTPException

app = FastAPI()

_OPS = {
    ast.Add: operator.add, ast.Sub: operator.sub,
    ast.Mult: operator.mul, ast.Div: operator.truediv,
    ast.USub: operator.neg,
}

def _evaluate(node: ast.AST) -> float:
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_evaluate(node.left), _evaluate(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_evaluate(node.operand))
    raise ValueError("unsupported expression")

@app.post("/formulas/evaluate")
def evaluate_formula(expression: str):
    try:
        return {"result": _evaluate(ast.parse(expression, mode="eval").body)}
    except ZeroDivisionError:
        raise HTTPException(status_code=422, detail="Division by zero")
    except (ValueError, SyntaxError, TypeError, RecursionError):
        raise HTTPException(status_code=422, detail="Invalid expression")
```

**Rule 2: Do not let request data choose code to import or attributes to resolve.**

Passing a request value to `importlib.import_module`, `__import__`, `getattr`, or `pickle.loads` reaches modules and functions the route never meant to expose, and import side effects run at load time. Resolve the target through a dictionary of handlers defined in code, keyed by a `Literal` or `Enum` so unknown values fail validation first.

```python
from enum import Enum
from fastapi import FastAPI

app = FastAPI()

class Report(str, Enum):
    sales = "sales"
    inventory = "inventory"

def _sales_report() -> dict: return {"report": "sales"}
def _inventory_report() -> dict: return {"report": "inventory"}

HANDLERS = {Report.sales: _sales_report, Report.inventory: _inventory_report}

@app.get("/reports/{name}")
def run_report(name: Report):
    return HANDLERS[name]()
```
