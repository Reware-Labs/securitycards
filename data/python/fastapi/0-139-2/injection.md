# Security cards

Repository: `https://github.com/fastapi/fastapi#0.139.2`
Category: injection

## injection

### Bind untrusted values into SQL statements as parameters

**Use when**

Building a SQL query where any part of the statement comes from a path parameter, query parameter, header, or request body.

**Secure rules**

**Rule 1: Pass request values as bound parameters, never as SQL text.**

Pydantic validates a field's type, but a validated `str` is still arbitrary text. Concatenating or formatting it into the statement lets a value such as `admin'--` change what the query means. Use `?` with `sqlite3`, `%s` with `psycopg`, or `:name` with SQLAlchemy `text()`. Placeholders bind values only — not table or column names.

```python
import sqlite3
from fastapi import FastAPI

app = FastAPI()

@app.get("/users/{email}")
def get_user(email: str):
    with sqlite3.connect("app.db") as conn:
        row = conn.execute(
            "SELECT id, username FROM users WHERE email = ?", (email,)
        ).fetchone()
    return {"id": row[0], "username": row[1]} if row else {}
```

**Rule 2: Map identifiers through an allowlist when a placeholder cannot be used.**

Table names, column names, and sort directions are part of the statement's syntax, so drivers will not bind them. Translate the request value through a dictionary or `Literal` defined in code and interpolate the result, which never contains caller-controlled text. Escaping the raw value instead is fragile and varies by database.

```python
from typing import Literal
import sqlite3
from fastapi import FastAPI

app = FastAPI()

SORT_COLUMNS = {"name": "name", "created": "created_at"}

@app.get("/products")
def list_products(sort_by: Literal["name", "created"] = "name"):
    column = SORT_COLUMNS[sort_by]   # a constant from our own code
    with sqlite3.connect("app.db") as conn:
        rows = conn.execute(
            f"SELECT id, name FROM products ORDER BY {column} LIMIT ?", (100,)
        ).fetchall()
    return [{"id": r[0], "name": r[1]} for r in rows]
```


### Invoke external programs as argument lists without a shell

**Use when**

Running an external tool where any argument is derived from request data, such as a filename, URL, or hostname.

**Secure rules**

**Rule 1: Run programs as an argument list rather than a shell string.**

`shell=True`, `os.system`, and `os.popen` hand the string to `/bin/sh`, which interprets `;`, `|`, backticks, and `$(...)`, so a filename such as `report.pdf; rm -rf /var/data` runs a second command. A list keeps every element a single argument because `subprocess` calls `execve` directly. `shell=False` is already the default — the risk is overriding it or assembling one long command string.

```python
import subprocess
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.post("/convert")
def convert(source: str, target: str):
    result = subprocess.run(
        ["convert", source, target],   # a list, not a command string
        capture_output=True,
        timeout=30,
    )
    if result.returncode != 0:
        raise HTTPException(status_code=422, detail="Conversion failed")
    return {"output": target}
```

**Rule 2: Stop request-derived arguments from being read as options.**

Without a shell there is still the program's own flag parser: an argument beginning with `-` becomes an option and can redirect output or enable an unintended mode. Rejecting leading dashes is the guard that always works, so make that the check you rely on. `--` is a widely followed convention rather than a guaranteed one: `getopt`-based tools honour it, but `g++` and `gcc` reject it outright with `unrecognized command-line option '--'`, so adding it to a compiler invocation breaks a command that was working. Pass `--` only to a program documented to accept it, and keep your own flags ahead of it, since many tools are order-sensitive.

```python
import subprocess
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.post("/reachability")
def check(host: str):
    if host.startswith("-"):
        raise HTTPException(status_code=422, detail="Invalid host")
    result = subprocess.run(
        ["ping", "-c", "1", "--", host],  # our flags first, then user data
        capture_output=True,
        timeout=10,
    )
    return {"reachable": result.returncode == 0}
```
