# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: output encoding

## output encoding

### Escape Untrusted Input When Rendering HTML Responses in Flask

**Use when**

Rendering manual HTML strings or dynamic user-controlled data within HTML templates and attributes.

**Secure rules**

**Rule 1: Explicitly escape untrusted user input using markupsafe.escape() or rely on Jinja's automatic escaping.**

Always explicitly escape untrusted user input using `markupsafe.escape()` when returning manual HTML strings or leverage Jinja's automatic HTML escaping features by passing dynamic variables into templates rendered via `render_template` instead of manually interpolating strings.

```python
from flask import request, render_template, g
from markupsafe import escape

@app.route('/hello')
def hello():
    name = request.args.get('name', 'Flask')
    return f'Hello, {escape(name)}!'

@app.route("/profile")
def profile():
    return render_template("profile.html", username=g.user["username"])
```

**Rule 2: Use the tojson filter when embedding server-side data into JavaScript or attribute contexts.**

Use Jinja's `|tojson` filter when embedding server-side data into HTML `<script>` tags or HTML data attributes to safely serialize and escape the data, and wrap attribute values containing `tojson` in single quotes.

```html
<script>
    const userNames = {{ names|tojson }};
    renderChart(userNames, {{ axis_data|tojson }});
</script>

<div data-chart='{{ chart_data|tojson }}'></div>
```
