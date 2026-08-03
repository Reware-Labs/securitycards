# Security cards

Repository: `https://github.com/symfony/symfony#v8.1.1`
Category: file handling

## file handling

### Sanitize and Isolate File Paths When Serving Uploads

**Use when**

Serving user-uploaded files and handling downloads via controller responses.

**Secure rules**

**Rule 1: Sanitize file paths to prevent path traversal and enforce attachment disposition.**

When serving files through `AbstractController`'s `file()` helper, sanitize input filenames using `basename()` to prevent path traversal and rely on attachment disposition to prevent browsers from executing untrusted files.

```php
public function download(string $filename): Response
{
    $path = $this->getParameter('kernel.project_dir') . '/var/uploads/' . basename($filename);
    return $this->file($path);
}
```
