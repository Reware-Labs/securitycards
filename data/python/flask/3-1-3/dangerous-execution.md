# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: dangerous execution

## dangerous execution

### Disable Debug Mode and Built-in Server in Production

**Use when**

Configuring deployment settings and launching the application in a production environment, or evaluating an expression supplied by a request.

**Secure rules**

**Rule 1: Avoid running the built-in development server or enabling debug mode in production to prevent arbitrary code execution vulnerabilities.**

Do not pass `--debug` or run the built-in development server in a production environment, because the interactive debugger allows arbitrary Python code execution from the browser. Instead, deploy the application using a dedicated production WSGI server.

```bash
gunicorn -w 4 'hello:app'
```

**Rule 2: Evaluate a user-supplied expression by parsing it with `ast` and allowing an explicit set of nodes, never with `eval()`.**

Stripping `__builtins__` does not make `eval()` safe: attribute traversal from any ordinary object reaches back into the interpreter, and a single `9**9**9` blocks the worker. Parse with `ast.parse(expression, mode="eval")`, accept only the node types the feature actually needs, and reject everything else.

```python
import ast
import operator

_BINOPS = {ast.Add: operator.add, ast.Sub: operator.sub,
           ast.Mult: operator.mul, ast.Div: operator.truediv}

def evaluate(expression: str) -> float:
    def visit(node):
        if isinstance(node, ast.Expression):
            return visit(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return node.value
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
            return -visit(node.operand)
        if isinstance(node, ast.BinOp) and type(node.op) in _BINOPS:
            return _BINOPS[type(node.op)](visit(node.left), visit(node.right))
        raise ValueError("unsupported expression")

    return visit(ast.parse(expression, mode="eval"))
```
