# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: file handling

## file handling

### Safely handle user-provided file names and paths during uploads and downloads

**Use when**

Handling file uploads from users or serving requested files from the filesystem.

**Secure rules**

**Rule 1: Sanitize untrusted filenames using `werkzeug.utils.secure_filename` before saving them to the filesystem.**

Always sanitize untrusted filenames using `werkzeug.utils.secure_filename` before combining them with upload paths or storing them on the filesystem to prevent directory traversal sequences from writing files outside the intended upload directory.

```python
from werkzeug.utils import secure_filename
import os

@app.route('/upload', methods=['POST'])
def upload_file():
    file = request.files['file']
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
```

**Rule 2: Use `send_from_directory` instead of `send_file` when serving user-provided paths.**

Never pass user-supplied file paths directly to `send_file()`, because it treats path arguments as trusted input and does not perform path traversal containment checks. Always use `send_from_directory()` to serve user-requested files safely from within a designated base directory.

```python
from flask import send_from_directory

@app.get('/uploads/<path:filename>')
def download_file(filename):
    return send_from_directory('/var/www/uploads', filename)
```
