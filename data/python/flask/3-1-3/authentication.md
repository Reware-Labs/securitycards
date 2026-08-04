# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: authentication

## authentication

### Validate user credentials during authentication

**Use when**

Handling user registration and login requests to verify presented identity credentials before creating session variables or querying the database.

**Secure rules**

**Rule 1: Validate username and password fields on the server side prior to processing authentication or registration requests.**

Check all incoming username and password inputs in your route handler to ensure they are present before proceeding with database queries or establishing authentication sessions.

```python
@bp.route('/register', methods=('GET', 'POST'))
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if not username:
            flash('Username is required.')
        elif not password:
            flash('Password is required.')
```
