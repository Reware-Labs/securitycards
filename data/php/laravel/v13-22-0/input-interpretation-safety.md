# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`
Category: input interpretation safety

## input interpretation safety

### Canonicalize and Validate Encoded Route Parameters Before Processing

**Use when**

When validating route parameters or path identifiers that undergo automatic URL decoding and require canonical interpretation.

**Secure rules**

**Rule 1: Apply explicit regex constraints using the where() method to validate route parameters before using them in filesystem operations or downstream logic.**

Laravel automatically URL-decodes percent-encoded route parameters during route matching. You must constrain and validate these parameters using the `where()` method to prevent unexpected interpretation or path traversal vulnerabilities.

```php
Route::get('/files/{file}', function (string $file) {
    return Storage::download($file);
})->where('file', '[a-zA-Z0-9_\-\.]+');
```
