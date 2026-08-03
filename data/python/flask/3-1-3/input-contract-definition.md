# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: input contract definition

## input contract definition

### Validate form data against explicit input constraints before processing

**Use when**

Handling incoming HTTP request form data or query parameters that require structural and type validation before executing business logic.

**Secure rules**

**Rule 1: Define explicit input validation rules on form models and enforce validation checks before processing request payloads.**

Bind HTTP request data such as `request.form` or `request.args` to form validation classes and strictly execute validation methods like `form.validate()` before accessing submitted fields in your application logic or database operations.

```python
@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegistrationForm(request.form)
    if request.method == 'POST' and form.validate():
        user = User(form.username.data, form.email.data, form.password.data)
        db_session.add(user)
        return redirect(url_for('login'))
    return render_template('register.html', form=form)
```
