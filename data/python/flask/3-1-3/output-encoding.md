# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: output encoding

## output encoding

### Escape Untrusted Input When Rendering HTML Responses in Flask

**Use when**

Rendering manual HTML strings or dynamic user-controlled data within HTML templates and attributes.

**Secure rules**

**Rule 1: Build HTML with Jinja templates so autoescaping applies to every interpolation, never by string concatenation or an f-string.**

Pass user-controlled values into `render_template` as template variables and let Jinja escape them at render time. Assembling a response with `+`, `%`, `.format()`, or an f-string bypasses autoescaping entirely and reintroduces cross-site scripting on every value you forget to escape by hand.

```python
from flask import render_template

@app.route("/profile")
def profile():
    return render_template("profile.html", username=g.user["username"])
```

**Rule 2: Explicitly escape untrusted user input with markupsafe.escape() when a route returns an HTML fragment directly.**

Where a handler returns HTML without a template, wrap every untrusted value in `markupsafe.escape()` at the point of interpolation so the fragment cannot carry markup supplied by the caller.

```python
from flask import request
from markupsafe import escape

@app.route('/hello')
def hello():
    name = request.args.get('name', 'Flask')
    return f'Hello, {escape(name)}!'
```

**Rule 3: Use the tojson filter when embedding server-side data into JavaScript or attribute contexts.**

Use Jinja's `|tojson` filter when embedding server-side data into HTML `<script>` tags or HTML data attributes to safely serialize and escape the data, and wrap attribute values containing `tojson` in single quotes.

```html
<script>
    const userNames = {{ names|tojson }};
    renderChart(userNames, {{ axis_data|tojson }});
</script>

<div data-chart='{{ chart_data|tojson }}'></div>
```
