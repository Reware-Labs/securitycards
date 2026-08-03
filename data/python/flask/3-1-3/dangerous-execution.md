# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: dangerous execution

## dangerous execution

### Disable Debug Mode and Built-in Server in Production

**Use when**

Configuring deployment settings and launching the application in a production environment.

**Secure rules**

**Rule 1: Avoid running the built-in development server or enabling debug mode in production to prevent arbitrary code execution vulnerabilities.**

Do not pass `--debug` or run the built-in development server in a production environment, because the interactive debugger allows arbitrary Python code execution from the browser. Instead, deploy the application using a dedicated production WSGI server.

```bash
gunicorn -w 4 'hello:app'
```
