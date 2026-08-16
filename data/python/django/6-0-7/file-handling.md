# Security cards

Repository: `https://github.com/django/django#6.0.7`
Category: file handling

## file handling

### Control File Overwriting in FileSystemStorage

**Use when**

When configuring file storage options to prevent user-controlled or colliding filenames from overwriting existing assets or data files.

**Secure rules**

**Rule 1: Explicitly control file overwriting behavior using allow_overwrite on FileSystemStorage.**

Set the `allow_overwrite` parameter when initializing `FileSystemStorage` to prevent unintended overwriting of existing files by user-uploaded content.

```python
from django.core.files.storage import FileSystemStorage

# Prevent overwriting existing files on save
storage = FileSystemStorage(allow_overwrite=False)
```


### Securely Configure Static File Storage and Asset Collection

**Use when**

Developing, configuring, and deploying static files and asset collection pipelines in Django applications.

**Secure rules**

**Rule 1: Use the `find_all=True` parameter when programmatically retrieving all matching static files.**

When using `django.contrib.staticfiles.finders.find()`, pass `find_all=True` to collect all matching locations. Avoid the removed legacy `all` parameter.

```python
from django.contrib.staticfiles import finders

matching_files = finders.find("css/base.css", find_all=True)
```

**Rule 2: Configure explicit non-empty directory roots for static file storage backends**

Ensure finder storage instances are configured with explicit, non-empty root directory paths to prevent fallback to the process working directory.

```python
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGES["default"]["OPTIONS"] = {"location": BASE_DIR / "media"}
MEDIA_ROOT = BASE_DIR / "media"
```

**Rule 3: Enforce valid static asset references and prevent missing file deployment failures.**

Verify that all referenced static asset paths inside CSS and JS exist prior to running `collectstatic` with `ManifestStaticFilesStorage` to avoid broken builds.

```python
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.ManifestStaticFilesStorage",
    },
}
```

**Rule 4: Exclude sensitive files, backups, and version control metadata during static asset collection**

Rely on default ignore patterns or specify custom `ignore_patterns` in a custom StaticFilesConfig subclass to prevent copying confidential files to the public `STATIC_ROOT` directory.

```python
from django.apps import AppConfig

class MyAppConfig(AppConfig):
    name = 'myapp'
    ignore_patterns = ['*.env', '*.bak', '*~', '.git*']
```

**Rule 5: Prevent infinite loops during static file post-processing.**

Ensure CSS and JS assets do not contain circular file references when using post-processing storages, and configure `max_post_process_passes` safely if custom logic is required.

```python
from django.contrib.staticfiles.storage import ManifestStaticFilesStorage

class CustomStaticStorage(ManifestStaticFilesStorage):
    max_post_process_passes = 5
```

**Rule 6: Avoid serving static files in production using insecure development handlers.**

Collect static assets into `STATIC_ROOT` and serve them directly via a dedicated web server, reverse proxy, or cloud storage backend instead of using Django's development server in production.

```python
from pathlib import Path
from django.conf import STATICFILES_STORAGE_ALIAS

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATIC_URL = '/static/'

STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    STATICFILES_STORAGE_ALIAS: {
        'BACKEND': 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage',
    },
}
```
